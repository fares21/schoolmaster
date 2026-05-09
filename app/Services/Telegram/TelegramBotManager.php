// app/Services/Telegram/TelegramBotManager.php
<?php

namespace App\Services\Telegram;

use App\Models\School;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class TelegramBotManager
{
    private array $bots = [];
    private const COMMANDS = [
        'start' => 'مرحباً بك! أنا بوت المدرسة الذكي.',
        'checkin' => 'لتسجيل الحضور، استخدم: /checkin [رمز_الطالب]',
        'my_children' => 'لعرض أبنائك، استخدم: /my_children',
        'ask' => 'للسؤال عن شيء، استخدم: /ask [سؤالك]',
        'attendance' => 'للاستعلام عن الحضور، استخدم: /attendance [تاريخ]',
        'grades' => 'للاستعلام عن الدرجات، استخدم: /grades [رمز_الطالب]',
        'help' => 'للمساعدة، استخدم: /help',
    ];
    
    /**
     * Get or create bot for a school
     */
    public function getBotForSchool(int $schoolId): ?array
    {
        if (isset($this->bots[$schoolId])) {
            return $this->bots[$schoolId];
        }
        
        $school = School::find($schoolId);
        
        if (!$school || !$school->telegram_bot_token) {
            return null;
        }
        
        $this->bots[$schoolId] = [
            'token' => $school->telegram_bot_token,
            'webhook_url' => config('app.url') . "/api/telegram/webhook/{$schoolId}",
            'commands' => self::COMMANDS,
        ];
        
        return $this->bots[$schoolId];
    }
    
    /**
     * Send message via Telegram
     */
    public function sendMessage(int $schoolId, string $chatId, string $message): bool
    {
        $bot = $this->getBotForSchool($schoolId);
        
        if (!$bot) {
            Log::warning("Telegram bot not configured for school: {$schoolId}");
            return false;
        }
        
        try {
            $response = Http::post("https://api.telegram.org/bot{$bot['token']}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => 'HTML',
            ]);
            
            return $response->successful();
        } catch (\Exception $e) {
            Log::error("Telegram send error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Set webhook for a school bot
     */
    public function setWebhook(int $schoolId): bool
    {
        $bot = $this->getBotForSchool($schoolId);
        
        if (!$bot) {
            return false;
        }
        
        try {
            $response = Http::post("https://api.telegram.org/bot{$bot['token']}/setWebhook", [
                'url' => $bot['webhook_url'],
                'allowed_updates' => ['message', 'callback_query'],
            ]);
            
            return $response->successful();
        } catch (\Exception $e) {
            Log::error("Telegram webhook error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Handle incoming webhook update
     */
    public function handleWebhook(int $schoolId, array $update): array
    {
        $message = $update['message'] ?? null;
        
        if (!$message) {
            return ['status' => 'ignored'];
        }
        
        $chatId = $message['chat']['id'];
        $text = $message['text'] ?? '';
        $userName = $message['from']['first_name'] ?? 'مستخدم';
        
        // Parse command
        if (str_starts_with($text, '/')) {
            $parts = explode(' ', $text, 2);
            $command = ltrim($parts[0], '/');
            $argument = $parts[1] ?? null;
            
            return $this->handleCommand($schoolId, $chatId, $userName, $command, $argument);
        }
        
        return ['status' => 'no_command'];
    }
    
    /**
     * Handle bot commands
     */
    private function handleCommand(int $schoolId, string $chatId, string $userName, string $command, ?string $argument): array
    {
        $response = match($command) {
            'start' => self::COMMANDS['start'] . "\n\n" . self::COMMANDS['help'],
            'help' => $this->getHelpText(),
            'checkin' => $this->handleCheckin($schoolId, $chatId, $userName, $argument),
            'my_children' => $this->handleMyChildren($schoolId, $chatId, $userName),
            'ask' => $this->handleAsk($schoolId, $chatId, $userName, $argument),
            'attendance' => $this->handleAttendance($schoolId, $chatId, $userName, $argument),
            'grades' => $this->handleGrades($schoolId, $chatId, $userName, $argument),
            default => "عذراً، الأمر <b>{$command}</b> غير معروف.\n" . self::COMMANDS['help'],
        };
        
        $this->sendMessage($schoolId, $chatId, $response);
        
        return [
            'status' => 'command_handled',
            'command' => $command,
            'chat_id' => $chatId,
        ];
    }
    
    /**
     * Get help text
     */
    private function getHelpText(): string
    {
        return "📖 <b>الأوامر المتاحة:</b>\n\n" .
               "/start - بدء البوت\n" .
               "/help - عرض هذه المساعدة\n" .
               "/checkin [رمز_الطالب] - تسجيل حضور (للمعلمين)\n" .
               "/my_children - عرض أبنائي (لأولياء الأمور)\n" .
               "/ask [سؤال] - سؤال المساعد الذكي\n" .
               "/attendance [تاريخ] - عرض الحضور\n" .
               "/grades [رمز_الطالب] - عرض الدرجات";
    }
    
    /**
     * Handle checkin command
     */
    private function handleCheckin(int $schoolId, string $chatId, string $userName, ?string $argument): string
    {
        // TODO: Implement checkin logic
        return "✓ تم تسجيل حضور الطالب بنجاح!";
    }
    
    /**
     * Handle my_children command
     */
    private function handleMyChildren(int $schoolId, string $chatId, string $userName): string
    {
        // TODO: Implement get children logic
        return "👨‍👩‍👧‍👦 <b>أبنائي:</b>\n\n• أحمد (الصف الخامس) - حضور اليوم: ✅\n• سارة (الصف الثالث) - حضور اليوم: ✅";
    }
    
    /**
     * Handle ask command
     */
    private function handleAsk(int $schoolId, string $chatId, string $userName, ?string $argument): string
    {
        if (!$argument) {
            return "❓ الرجاء كتابة سؤالك بعد الأمر /ask";
        }
        
        // TODO: Call AI service
        return "🤖 <b>المساعد الذكي:</b>\n\nهذا رد تجريبي على سؤالك: " . $argument;
    }
    
    /**
     * Handle attendance command
     */
    private function handleAttendance(int $schoolId, string $chatId, string $userName, ?string $argument): string
    {
        // TODO: Implement attendance check
        return "📊 <b>تقرير الحضور</b>\n\nاليوم: 15/15 طالب حاضر بنسبة 100%";
    }
    
    /**
     * Handle grades command
     */
    private function handleGrades(int $schoolId, string $chatId, string $userName, ?string $argument): string
    {
        // TODO: Implement grades check
        return "📚 <b>الدرجات</b>\n\nالرياضيات: 95%\nالعلوم: 88%";
    }
}