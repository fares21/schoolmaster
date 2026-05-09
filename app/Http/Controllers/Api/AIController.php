// app/Http/Controllers/Api/AIController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AI\AIOrchestrator;
use App\Models\AIUsage;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AIController extends Controller
{
    protected $aiOrchestrator;

    public function __construct(AIOrchestrator $aiOrchestrator)
    {
        $this->aiOrchestrator = $aiOrchestrator;
    }

    // Send message to AI
    public function chat(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required|string|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        $school = $request->attributes->get('school');

        // Strict policy: Only school_admin can access AI
        if (!$user->canAccessAI()) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك باستخدام الذكاء الاصطناعي. هذه الميزة متاحة فقط لمدير المدرسة.'
            ], 403);
        }

        // Check if school has enough budget
        $remainingBudget = $school->getRemainingAIBudgetForToday();
        if ($remainingBudget <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'تم استنفاذ ميزانية الذكاء الاصطناعي اليومية (0.50$). الرجاء المحاولة غداً.'
            ], 429);
        }

        // Process AI request
        $result = $this->aiOrchestrator->processRequest(
            $request->message,
            $user->id,
            $school->id
        );

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message']
            ], 500);
        }

        // Log the usage
        AIUsage::create([
            'school_id' => $school->id,
            'user_id' => $user->id,
            'prompt' => $request->message,
            'response' => $result['response'],
            'prompt_tokens' => $result['prompt_tokens'],
            'completion_tokens' => $result['completion_tokens'],
            'total_tokens' => $result['total_tokens'],
            'cost' => $result['cost'],
            'model_used' => $result['model'],
            'response_time' => $result['response_time'],
            'status' => 'success',
        ]);

        AuditLog::log(
            $school->id,
            $user->id,
            'ai_chat',
            ['tokens' => $result['total_tokens'], 'cost' => $result['cost']]
        );

        return response()->json([
            'success' => true,
            'message' => [
                'id' => time(),
                'content' => $result['response'],
                'is_user' => false,
                'created_at' => now()->toISOString()
            ],
            'tokens' => $result['total_tokens'],
            'cost' => $result['cost'],
            'model' => $result['model'],
            'remaining_budget' => $school->getRemainingAIBudgetForToday() - $result['cost']
        ]);
    }

    // Get AI usage statistics
    public function getStats(Request $request)
    {
        $user = $request->user();
        $school = $request->attributes->get('school');

        $todayCost = AIUsage::where('school_id', $school->id)
            ->whereDate('created_at', today())
            ->sum('cost');

        $stats = [
            'total_requests' => AIUsage::where('school_id', $school->id)->count(),
            'total_tokens' => AIUsage::where('school_id', $school->id)->sum('total_tokens'),
            'total_cost' => AIUsage::where('school_id', $school->id)->sum('cost'),
            'today_requests' => AIUsage::where('school_id', $school->id)->whereDate('created_at', today())->count(),
            'today_cost' => $todayCost,
            'remaining_budget' => $school->getAIDailyBudget() - $todayCost,
            'daily_limit' => $school->getAIDailyBudget(),
        ];

        $stats['remaining_percentage'] = $stats['daily_limit'] > 0 
            ? round(($stats['remaining_budget'] / $stats['daily_limit']) * 100, 2)
            : 0;

        return response()->json(['success' => true, 'data' => $stats]);
    }

    // Get usage report
    public function getUsageReport(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $schoolId = $request->attributes->get('school_id');

        $dailyData = AIUsage::where('school_id', $schoolId)
            ->whereBetween('created_at', [$request->start_date, $request->end_date . ' 23:59:59'])
            ->selectRaw('DATE(created_at) as date, SUM(total_tokens) as tokens, SUM(cost) as cost, COUNT(*) as requests')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $modelBreakdown = AIUsage::where('school_id', $schoolId)
            ->whereBetween('created_at', [$request->start_date, $request->end_date . ' 23:59:59'])
            ->selectRaw('model_used, SUM(cost) as value')
            ->groupBy('model_used')
            ->get();

        $topUsers = AIUsage::where('school_id', $schoolId)
            ->whereBetween('created_at', [$request->start_date, $request->end_date . ' 23:59:59'])
            ->with('user')
            ->selectRaw('user_id, COUNT(*) as total_requests, SUM(total_tokens) as total_tokens, SUM(cost) as total_cost')
            ->groupBy('user_id')
            ->orderBy('total_cost', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'daily_data' => $dailyData,
            'model_breakdown' => $modelBreakdown,
            'top_users' => $topUsers,
        ]);
    }
}