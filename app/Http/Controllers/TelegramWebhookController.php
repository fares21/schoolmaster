<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Models\User;
use App\Models\Student;
use App\Models\Attendance;
use App\Models\Grade;
use App\Services\AI\AIOrchestrator;
use App\Services\Telegram\TelegramBotManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class TelegramWebhookController extends Controller
{
    protected TelegramBotManager $telegramBotManager;
    protected AIOrchestrator $aiOrchestrator;

    public function __construct(
        TelegramBotManager $telegramBotManager,
        AIOrchestrator $aiOrchestrator
    ) {
        $this->telegramBotManager = $telegramBotManager;
        $this->aiOrchestrator = $aiOrchestrator;
    }

    /**
     * Handle incoming Telegram webhook requests
     * POST /api/telegram/webhook/{schoolId}
     */
    public function handle(Request $request, $schoolId)
    {
        try {
            // Log incoming webhook for debugging
            Log::info('Telegram webhook received', [
                'school_id' => $schoolId,
                'update_id' => $request->input('update_id')
            ]);

            // Get school
            $school = School::find($schoolId);
            if (!$school || !$school->telegram_bot_token) {
                Log::warning('School not found or bot not configured', ['school_id' => $schoolId]);
                return response()->json(['status' => 'error', 'message' => 'School not found'], 404);
            }

            // Get update data
            $update = $request->all();
            
            // Process message
            $result = $this->processUpdate($school, $update);
            
            return response()->json(['status' => 'ok', 'result' => $result]);
            
        } catch (\Exception $e) {
            Log::error('Telegram webhook error', [
                'school_id' => $schoolId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Process incoming update
     */
    private function processUpdate(School $school, array $update): array
    {
        // Check if it's a message
        if (isset($update['message'])) {
            return $this->handleMessage($school, $update['message']);
        }
        
        // Check if it's a callback query (button press)
        if (isset($update['callback_query'])) {
            return $this->handleCallbackQuery($school, $update['callback_query']);
        }
        
        return ['status' => 'ignored', 'reason' => 'Unknown update type'];
    }

    /**
     * Handle regular text message
     */
    private function handleMessage(School $school, array $message): array
    {
        $chatId = $message['chat']['id'];
        $text = trim($message['text'] ?? '');
        $userId = $message['from']['id'] ?? null;
        $username = $message['from']['username'] ?? $message['from']['first_name'] ?? 'مستخدم';
        
        // Link user by Telegram chat ID
        $user = User::where('telegram_chat_id', $chatId)
            ->where('school_id', $school->id)
            ->first();
        
        // If user not found, ask to register
        if (!$user) {
            $this->sendMessage($school, $chatId, $this->getRegistrationMessage($school));
            return ['status' => 'user_not_registered', 'chat_id' => $chatId];
        }
        
        // Check if it's a command
        if (str_starts_with($text, '/')) {
            return $this->handleCommand($school, $user, $chatId, $username, $text);
        }
        
        // Regular message (not a command) - for AI chat only
        if ($user->canAccessAI()) {
            return $this->handleAIQuery($school, $user, $chatId, $text);
        }
        
        $this->sendMessage($school, $chatId, "عذراً، لم أتعرف على الأمر. أرسل /help لمعرفة الأوامر المتاحة.");
        
        return ['status' => 'unknown_command', 'chat_id' => $chatId];
    }

    /**
     * Handle slash commands
     */
    private function handleCommand(School $school, User $user, string $chatId, string $username, string $text): array
    {
        $parts = explode(' ', $text, 2);
        $command = ltrim($parts[0], '/');
        $argument = $parts[1] ?? null;
        
        switch ($command) {
            case 'start':
                $this->handleStartCommand($school, $user, $chatId, $username);
                break;
                
            case 'help':
                $this->sendHelpMessage($school, $chatId, $user->role);
                break;
                
            case 'checkin':
                $this->handleCheckinCommand($school, $user, $chatId, $argument);
                break;
                
            case 'my_children':
                $this->handleMyChildrenCommand($school, $user, $chatId);
                break;
                
            case 'attendance':
                $this->handleAttendanceCommand($school, $user, $chatId, $argument);
                break;
                
            case 'grades':
                $this->handleGradesCommand($school, $user, $chatId, $argument);
                break;
                
            case 'ask':
                $this->handleAIQuery($school, $user, $chatId, $argument ?? '');
                break;
                
            case 'balance':
                $this->handleBalanceCommand($school, $user, $chatId);
                break;
                
            default:
                $this->sendMessage($school, $chatId, "عذراً، الأمر /{$command} غير معروف. أرسل /help لمعرفة الأوامر المتاحة.");
                break;
        }
        
        return ['status' => 'command_handled', 'command' => $command, 'chat_id' => $chatId];
    }

    /**
     * Handle /start command
     */
    private function handleStartCommand(School $school, User $user, string $chatId, string $username): void
    {
        $roleMessages = [
            'super_admin' => 'مرحباً بك في لوحة التحكم الشاملة للمنصة.',
            'school_admin' => 'مرحباً بك مدير المدرسة. يمكنك إدارة المدرسة بالكامل عبر هذا البوت.',
            'teacher' => 'مرحباً بك أستاذ/أستاذة. يمكنك تسجيل الحضور ومتابعة الطلاب.',
            'student' => 'مرحباً بك عزيزي الطالب. يمكنك متابعة درجاتك وحضورك.',
            'parent' => 'مرحباً بك ولي أمر. يمكنك متابعة أبنائك.',
        ];
        
        $message = "👋 مرحباً {$user->full_name}!\n\n";
        $message .= "🏫 {$school->name}\n";
        $message .= "👤 دورك: " . $this->getRoleName($user->role) . "\n\n";
        $message .= $roleMessages[$user->role] ?? 'مرحباً بك في نظام المدرسة.\n\n';
        $message .= "\n📖 أرسل /help لمعرفة الأوامر المتاحة.";
        
        $this->sendMessage($school, $chatId, $message);
    }

    /**
     * Handle /checkin command - mark attendance (for teachers only)
     */
    private function handleCheckinCommand(School $school, User $user, string $chatId, ?string $argument): void
    {
        // Only teachers can mark attendance
        if (!$user->isTeacher()) {
            $this->sendMessage($school, $chatId, "❌ عذراً، هذه الميزة متاحة فقط للمعلمين.");
            return;
        }
        
        if (!$argument) {
            $this->sendMessage($school, $chatId, "📝 الرجاء استخدام الصيغة التالية:\n\n/checkin [رمز_الطالب]\n\nمثال: /checkin STU-2024-001");
            return;
        }
        
        // Find student by code
        $student = Student::where('student_code', $argument)
            ->where('school_id', $school->id)
            ->first();
        
        if (!$student) {
            $this->sendMessage($school, $chatId, "❌ لم يتم العثور على طالب بالرمز: {$argument}");
            return;
        }
        
        // Check if student is in teacher's class
        $teacherClasses = $user->teacher->classes()->pluck('id')->toArray();
        if (!in_array($student->class_id, $teacherClasses)) {
            $this->sendMessage($school, $chatId, "❌ هذا الطالب ليس ضمن فصولك الدراسية.");
            return;
        }
        
        // Check if already marked today
        $existingAttendance = Attendance::where('student_id', $student->id)
            ->whereDate('date', today())
            ->first();
        
        if ($existingAttendance) {
            $this->sendMessage($school, $chatId, "⚠️ تم تسجيل حضور الطالب {$student->full_name} بالفعل اليوم.\nالحالة: {$this->getAttendanceStatusName($existingAttendance->status)}");
            return;
        }
        
        // Mark attendance
        $attendance = Attendance::create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'class_id' => $student->class_id,
            'date' => today(),
            'status' => Attendance::STATUS_PRESENT,
            'recorded_by' => $user->id,
        ]);
        
        $message = "✅ تم تسجيل حضور الطالب بنجاح!\n\n";
        $message .= "👦 الطالب: {$student->full_name}\n";
        $message .= "📚 الصف: {$student->class->name}\n";
        $message .= "⏰ الوقت: " . now()->format('h:i A') . "\n";
        $message .= "📅 التاريخ: " . now()->format('Y-m-d');
        
        $this->sendMessage($school, $chatId, $message);
        
        // Send notification to parent (if parent has Telegram)
        if ($student->parent_id) {
            $parent = User::find($student->parent_id);
            if ($parent && $parent->telegram_chat_id) {
                $parentMessage = "✅ تم تسجيل حضور ابنكم/ابنتكم {$student->full_name}\n";
                $parentMessage .= "⏰ الوقت: " . now()->format('h:i A');
                $this->sendMessage($school, $parent->telegram_chat_id, $parentMessage);
            }
        }
    }

    /**
     * Handle /my_children command (for parents)
     */
    private function handleMyChildrenCommand(School $school, User $user, string $chatId): void
    {
        if (!$user->isParent()) {
            $this->sendMessage($school, $chatId, "❌ عذراً، هذه الميزة متاحة فقط لأولياء الأمور.");
            return;
        }
        
        $children = $user->parentStudents()->with('student')->get();
        
        if ($children->isEmpty()) {
            $this->sendMessage($school, $chatId, "📭 لا يوجد أبناء مسجلين باسمك في النظام.");
            return;
        }
        
        $message = "👨‍👩‍👧‍👦 <b>أبنائي:</b>\n\n";
        
        foreach ($children as $child) {
            $student = $child->student;
            $todayAttendance = $student->getTodayAttendance();
            $attendanceStatus = $todayAttendance ? $this->getAttendanceStatusName($todayAttendance->status) : 'لم يسجل بعد';
            $averageGrade = $student->getAverageGrade();
            
            $message .= "👦 <b>{$student->full_name}</b>\n";
            $message .= "   📚 الصف: {$student->class->name}\n";
            $message .= "   ✅ حضور اليوم: {$attendanceStatus}\n";
            $message .= "   📊 المعدل: {$averageGrade}%\n";
            $message .= "   ─────────────────\n";
        }
        
        $message .= "\n📖 أرسل /attendance [رمز_الطالب] لمشاهدة سجل الحضور التفصيلي\n";
        $message .= "📖 أرسل /grades [رمز_الطالب] لمشاهدة الدرجات";
        
        $this->sendMessage($school, $chatId, $message);
    }

    /**
     * Handle /attendance command
     */
    private function handleAttendanceCommand(School $school, User $user, string $chatId, ?string $argument): void
    {
        $studentId = null;
        
        // If parent and argument provided, check if it's their child
        if ($user->isParent()) {
            if ($argument) {
                $student = Student::where('student_code', $argument)
                    ->orWhere('id', $argument)
                    ->first();
                
                if ($student && $student->parent_id === $user->id) {
                    $studentId = $student->id;
                } else {
                    $this->sendMessage($school, $chatId, "❌ لم يتم العثور على طالب بالرمز {$argument} أو ليس من أبنائك.");
                    return;
                }
            } else {
                $this->sendMessage($school, $chatId, "📝 الرجاء استخدام الصيغة: /attendance [رمز_الطالب]\nمثال: /attendance STU-2024-001");
                return;
            }
        }
        
        // For students, they can only see their own attendance
        if ($user->isStudent()) {
            $student = $user->student;
            $studentId = $student->id;
        }
        
        if (!$studentId) {
            $this->sendMessage($school, $chatId, "❌ لا يمكن عرض بيانات الحضور.");
            return;
        }
        
        $student = Student::find($studentId);
        
        // Get attendance records for last 30 days
        $records = Attendance::where('student_id', $studentId)
            ->whereDate('date', '>=', now()->subDays(30))
            ->orderBy('date', 'desc')
            ->get();
        
        $presentCount = $records->where('status', Attendance::STATUS_PRESENT)->count();
        $absentCount = $records->where('status', Attendance::STATUS_ABSENT)->count();
        $lateCount = $records->where('status', Attendance::STATUS_LATE)->count();
        $excusedCount = $records->where('status', Attendance::STATUS_EXCUSED)->count();
        $totalDays = $records->count();
        $attendanceRate = $totalDays > 0 ? round(($presentCount / $totalDays) * 100, 1) : 0;
        
        $message = "📊 <b>سجل حضور {$student->full_name}</b>\n";
        $message .= "📅 آخر 30 يوماً\n\n";
        $message .= "✅ حاضر: {$presentCount} يوم\n";
        $message .= "❌ غائب: {$absentCount} يوم\n";
        $message .= "⏰ متأخر: {$lateCount} يوم\n";
        $message .= "📝 بعذر: {$excusedCount} يوم\n";
        $message .= "📈 نسبة الحضور: {$attendanceRate}%\n\n";
        
        // Show last 5 records
        $message .= "📋 <b>آخر التسجيلات:</b>\n";
        foreach ($records->take(5) as $record) {
            $statusIcon = $record->status === 'present' ? '✅' : ($record->status === 'absent' ? '❌' : '⏰');
            $message .= "{$statusIcon} {$record->date->format('Y-m-d')} - {$this->getAttendanceStatusName($record->status)}\n";
        }
        
        $this->sendMessage($school, $chatId, $message);
    }

    /**
     * Handle /grades command
     */
    private function handleGradesCommand(School $school, User $user, string $chatId, ?string $argument): void
    {
        $studentId = null;
        
        // For teachers, they need to specify which student
        if ($user->isTeacher()) {
            if (!$argument) {
                $this->sendMessage($school, $chatId, "📝 الرجاء استخدام الصيغة: /grades [رمز_الطالب]\nمثال: /grades STU-2024-001");
                return;
            }
            
            $student = Student::where('student_code', $argument)
                ->where('school_id', $school->id)
                ->first();
            
            if (!$student) {
                $this->sendMessage($school, $chatId, "❌ لم يتم العثور على طالب بالرمز: {$argument}");
                return;
            }
            
            $studentId = $student->id;
        }
        
        // For parents
        if ($user->isParent()) {
            if ($argument) {
                $student = Student::where('student_code', $argument)
                    ->orWhere('id', $argument)
                    ->first();
                
                if ($student && $student->parent_id === $user->id) {
                    $studentId = $student->id;
                } else {
                    $this->sendMessage($school, $chatId, "❌ لم يتم العثور على طالب بالرمز {$argument} أو ليس من أبنائك.");
                    return;
                }
            } else {
                $children = $user->parentStudents()->with('student')->get();
                if ($children->count() === 1) {
                    $studentId = $children->first()->student_id;
                } else {
                    $this->sendMessage($school, $chatId, "📝 الرجاء تحديد الطالب: /grades [رمز_الطالب]");
                    return;
                }
            }
        }
        
        // For students
        if ($user->isStudent()) {
            $student = $user->student;
            $studentId = $student->id;
        }
        
        if (!$studentId) {
            $this->sendMessage($school, $chatId, "❌ لا يمكن عرض بيانات الدرجات.");
            return;
        }
        
        $student = Student::find($studentId);
        
        // Get grades
        $grades = Grade::where('student_id', $studentId)
            ->with('subject')
            ->orderBy('test_date', 'desc')
            ->take(15)
            ->get();
        
        if ($grades->isEmpty()) {
            $this->sendMessage($school, $chatId, "📭 لا توجد درجات مسجلة للطالب {$student->full_name} حالياً.");
            return;
        }
        
        $average = $student->getAverageGrade();
        
        $message = "📚 <b>درجات {$student->full_name}</b>\n";
        $message .= "📊 المعدل العام: {$average}%\n\n";
        $message .= "<b>آخر الدرجات:</b>\n";
        
        $currentSubject = null;
        foreach ($grades as $grade) {
            $percentage = $grade->getPercentage();
            $gradeIcon = $percentage >= 90 ? '🌟' : ($percentage >= 80 ? '⭐' : ($percentage >= 70 ? '📘' : '📙'));
            
            if ($currentSubject !== $grade->subject->name) {
                $currentSubject = $grade->subject->name;
                $message .= "\n📖 <b>{$currentSubject}</b>\n";
            }
            
            $message .= "   {$gradeIcon} {$grade->test_name}: {$percentage}%\n";
        }
        
        $this->sendMessage($school, $chatId, $message);
    }

    /**
     * Handle /ask command - AI query
     */
    private function handleAIQuery(School $school, User $user, string $chatId, string $question): array
    {
        // Strict policy: Only school_admin can access AI
        if (!$user->canAccessAI()) {
            $this->sendMessage($school, $chatId, "❌ عذراً، ميزة الذكاء الاصطناعي متاحة فقط لمدير المدرسة.");
            return ['status' => 'ai_access_denied'];
        }
        
        if (empty(trim($question))) {
            $this->sendMessage($school, $chatId, "📝 الرجاء كتابة سؤالك بعد الأمر /ask\nمثال: /ask ما هي نسبة الحضور هذا الأسبوع؟");
            return ['status' => 'no_question'];
        }
        
        // Send typing indicator
        $this->sendChatAction($school, $chatId, 'typing');
        
        // Process AI request
        $result = $this->aiOrchestrator->processRequest(
            $question,
            $user->id,
            $school->id
        );
        
        if (!$result['success']) {
            $this->sendMessage($school, $chatId, "🤖 عذراً، حدث خطأ: {$result['message']}");
            return ['status' => 'ai_error'];
        }
        
        // Send AI response
        $response = "🤖 <b>المساعد الذكي</b>\n\n";
        $response .= $result['response'] . "\n\n";
        $response .= "─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─\n";
        $response .= "📊 <b>الاستهلاك:</b>\n";
        $response .= "🪙 التوكينز: {$result['total_tokens']}\n";
        $response .= "💰 التكلفة: \${$result['cost']}\n";
        $response .= "🤖 النموذج: " . ($result['model'] === 'deepseek' ? 'DeepSeek' : 'Gemini') . "\n";
        $response .= "⏱️ الوقت: {$result['response_time']}ms";
        
        $this->sendMessage($school, $chatId, $response);
        
        return ['status' => 'ai_handled', 'tokens' => $result['total_tokens'], 'cost' => $result['cost']];
    }

    /**
     * Handle /balance command - check AI budget (school admin only)
     */
    private function handleBalanceCommand(School $school, User $user, string $chatId): void
    {
        if (!$user->canAccessAI()) {
            $this->sendMessage($school, $chatId, "❌ هذه الميزة متاحة فقط لمدير المدرسة.");
            return;
        }
        
        $remaining = $school->getRemainingAIBudgetForToday();
        $dailyLimit = $school->getAIDailyBudget();
        $used = $dailyLimit - $remaining;
        $percentage = $dailyLimit > 0 ? round(($used / $dailyLimit) * 100, 1) : 0;
        
        $message = "💰 <b>ميزانية الذكاء الاصطناعي</b>\n\n";
        $message .= "📅 تاريخ اليوم: " . now()->format('Y-m-d') . "\n";
        $message .= "💰 الحد اليومي: \${$dailyLimit}\n";
        $message .= "💸 المستهلك اليوم: \${$used}\n";
        $message .= "💚 المتبقي: \${$remaining}\n";
        $message .= "📊 نسبة الاستهلاك: {$percentage}%\n\n";
        
        if ($remaining <= 0) {
            $message .= "⚠️ تم استنفاذ الميزانية اليومية. ستتجدد غداً.";
        } elseif ($remaining < 0.10) {
            $message .= "⚠️ تنبيه: الميزانية على وشك النفاذ!";
        } else {
            $message .= "✅ الميزانية كافية للاستخدام اليوم.";
        }
        
        $this->sendMessage($school, $chatId, $message);
    }

    /**
     * Handle callback query (button presses)
     */
    private function handleCallbackQuery(School $school, array $callbackQuery): array
    {
        $data = $callbackQuery['data'] ?? '';
        $chatId = $callbackQuery['message']['chat']['id'] ?? null;
        $messageId = $callbackQuery['message']['message_id'] ?? null;
        
        // Parse callback data
        parse_str($data, $params);
        
        switch ($params['action'] ?? null) {
            case 'view_attendance':
                // Handle view attendance button
                break;
                
            case 'view_grades':
                // Handle view grades button
                break;
                
            default:
                break;
        }
        
        // Answer callback query
        $this->answerCallbackQuery($school, $callbackQuery['id'], 'تم الاستلام');
        
        return ['status' => 'callback_handled'];
    }

    /**
     * Send message via Telegram
     */
    private function sendMessage(School $school, string $chatId, string $message): bool
    {
        return $this->telegramBotManager->sendMessage($school->id, $chatId, $message);
    }

    /**
     * Send chat action (typing, etc.)
     */
    private function sendChatAction(School $school, string $chatId, string $action): void
    {
        $bot = $this->telegramBotManager->getBotForSchool($school->id);
        
        if (!$bot) {
            return;
        }
        
        try {
            \Illuminate\Support\Facades\Http::post(
                "https://api.telegram.org/bot{$bot['token']}/sendChatAction",
                [
                    'chat_id' => $chatId,
                    'action' => $action
                ]
            );
        } catch (\Exception $e) {
            Log::error('Telegram sendChatAction error: ' . $e->getMessage());
        }
    }

    /**
     * Answer callback query
     */
    private function answerCallbackQuery(School $school, string $callbackId, string $text): void
    {
        $bot = $this->telegramBotManager->getBotForSchool($school->id);
        
        if (!$bot) {
            return;
        }
        
        try {
            \Illuminate\Support\Facades\Http::post(
                "https://api.telegram.org/bot{$bot['token']}/answerCallbackQuery",
                [
                    'callback_query_id' => $callbackId,
                    'text' => $text,
                    'show_alert' => false
                ]
            );
        } catch (\Exception $e) {
            Log::error('Telegram answerCallbackQuery error: ' . $e->getMessage());
        }
    }

    /**
     * Get registration message for unregistered users
     */
    private function getRegistrationMessage(School $school): string
    {
        return "🤖 <b>مرحباً بك في بوت {$school->name}</b>\n\n" .
               "للاستفادة من خدمات البوت، يرجى ربط حسابك أولاً.\n\n" .
               "🔗 <b>طريقة التسجيل:</b>\n" .
               "1. قم بتسجيل الدخول إلى منصة المدرسة\n" .
               "2. اذهب إلى الإعدادات → ربط تليغرام\n" .
               "3. أدخل هذا الرمز: <code>" . substr(md5($school->id . date('Y-m-d')), 0, 8) . "</code>\n\n" .
               "بعد ربط الحساب، أرسل /start مرة أخرى.\n\n" .
               "📞 للاستفسار: تواصل مع إدارة المدرسة.";
    }

    /**
     * Send help message based on user role
     */
    private function sendHelpMessage(School $school, string $chatId, string $role): void
    {
        $commonCommands = "/start - بدء البوت\n/help - عرض هذه المساعدة\n";
        
        $roleCommands = match($role) {
            'teacher' => "/checkin [رمز_الطالب] - تسجيل حضور طالب\n/attendance - عرض حضور اليوم\n/grades [رمز_الطالب] - عرض درجات طالب\n",
            'parent' => "/my_children - عرض أبنائي\n/attendance [رمز_الطالب] - حضور ابنك\n/grades [رمز_الطالب] - درجات ابنك\n",
            'student' => "/attendance - حضورى\n/grades - درجاتى\n",
            'school_admin' => "/ask [سؤال] - سؤال المساعد الذكي\n/balance - ميزانية الذكاء الاصطناعي\n/attendance - إحصائيات الحضور\n",
            default => '',
        };
        
        $message = "📖 <b>الأوامر المتاحة:</b>\n\n";
        $message .= $commonCommands;
        $message .= $roleCommands;
        
        if ($role === 'school_admin') {
            $remaining = $school->getRemainingAIBudgetForToday();
            $message .= "\n💰 الميزانية المتبقية اليوم: \${$remaining}";
        }
        
        $this->sendMessage($school, $chatId, $message);
    }

    /**
     * Get role name in Arabic
     */
    private function getRoleName(string $role): string
    {
        return match($role) {
            'super_admin' => 'مشرف عام',
            'school_admin' => 'مدير مدرسة',
            'teacher' => 'معلم',
            'student' => 'طالب',
            'parent' => 'ولي أمر',
            default => $role,
        };
    }

    /**
     * Get attendance status name in Arabic
     */
    private function getAttendanceStatusName(string $status): string
    {
        return match($status) {
            Attendance::STATUS_PRESENT => 'حاضر',
            Attendance::STATUS_ABSENT => 'غائب',
            Attendance::STATUS_LATE => 'متأخر',
            Attendance::STATUS_EXCUSED => 'بعذر',
            default => $status,
        };
    }
}
