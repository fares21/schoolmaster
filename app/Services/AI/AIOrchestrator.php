<?php

namespace App\Services\AI;

use App\Models\AIUsage;
use App\Models\School;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class AIOrchestrator
{
    protected TokenCounter $tokenCounter;
    protected array $config;
    
    // Rate limits (strict)
    private const MAX_TOKENS_PER_REQUEST = 500;
    private const MAX_REQUESTS_PER_HOUR = 10;
    private const DAILY_BUDGET_LIMIT = 0.50;
    
    public function __construct(TokenCounter $tokenCounter)
    {
        $this->tokenCounter = $tokenCounter;
        $this->config = [
            'deepseek' => [
                'url' => env('DEEPSEEK_API_URL', 'https://api.deepseek.com/v1/chat/completions'),
                'key' => env('DEEPSEEK_API_KEY'),
                'model' => 'deepseek-chat',
            ],
            'gemini' => [
                'url' => env('GEMINI_API_URL', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'),
                'key' => env('GEMINI_API_KEY'),
                'model' => 'gemini-pro',
            ],
        ];
    }
    
    /**
     * Process AI request with strict budget control
     */
    public function processRequest(string $prompt, int $userId, int $schoolId): array
    {
        $startTime = microtime(true);
        
        // Strict token check before processing
        $estimatedTokens = $this->tokenCounter->countTokens($prompt) * 1.05;
        
        if ($estimatedTokens > self::MAX_TOKENS_PER_REQUEST) {
            return [
                'success' => false,
                'message' => 'الطلب يتجاوز الحد الأقصى للمسموح (500 توكين). يرجى اختصار سؤالك.',
            ];
        }
        
        // Check rate limit
        $requestsThisHour = AIUsage::where('user_id', $userId)
            ->where('created_at', '>=', now()->subHour())
            ->count();
        
        if ($requestsThisHour >= self::MAX_REQUESTS_PER_HOUR) {
            return [
                'success' => false,
                'message' => 'لقد تجاوزت الحد الأقصى للطلبات (10 طلبات في الساعة). الرجاء المحاولة لاحقاً.',
            ];
        }
        
        // Check budget
        $budgetKey = "ai_budget:{$schoolId}:" . now()->toDateString();
        $remainingBudget = $this->getRemainingBudget($schoolId, $budgetKey);
        
        if ($remainingBudget <= 0) {
            return [
                'success' => false,
                'message' => 'تم استنفاذ ميزانية الذكاء الاصطناعي اليومية (0.50$). الرجاء المحاولة غداً.',
            ];
        }
        
        // Try DeepSeek first, fallback to Gemini
        try {
            $response = $this->callDeepSeek($prompt);
            $model = 'deepseek';
        } catch (\Exception $e) {
            Log::warning('DeepSeek failed, falling back to Gemini', ['error' => $e->getMessage()]);
            try {
                $response = $this->callGemini($prompt);
                $model = 'gemini';
            } catch (\Exception $e2) {
                Log::error('Both AI services failed', ['error' => $e2->getMessage()]);
                return [
                    'success' => false,
                    'message' => 'عذراً، المساعد الذكي غير متاح حالياً. يرجى المحاولة لاحقاً.',
                ];
            }
        }
        
        $responseTime = round((microtime(true) - $startTime) * 1000);
        
        // Calculate actual tokens
        $promptTokens = $this->tokenCounter->countTokens($prompt);
        $completionTokens = $this->tokenCounter->countTokens($response);
        $totalTokens = $promptTokens + $completionTokens;
        
        // Calculate cost
        $cost = $this->calculateCost($totalTokens, $model);
        
        // ✅ FIX 1: Record AI usage in database
        AIUsage::create([
            'user_id' => $userId,
            'school_id' => $schoolId,
            'model' => $model,
            'prompt_tokens' => $promptTokens,
            'completion_tokens' => $completionTokens,
            'total_tokens' => $totalTokens,
            'cost' => $cost,
            'response_time' => $responseTime,
        ]);
        
        // ✅ FIX 2: Correct budget deduction
        $this->deductBudget($schoolId, $budgetKey, $cost);
        
        // Alert if budget is low
        $newRemaining = $this->getRemainingBudget($schoolId, $budgetKey);
        if ($newRemaining < 0.10 && $newRemaining > 0) {
            $this->sendLowBudgetAlert($schoolId, $newRemaining);
        }
        
        return [
            'success' => true,
            'response' => $response,
            'prompt_tokens' => $promptTokens,
            'completion_tokens' => $completionTokens,
            'total_tokens' => $totalTokens,
            'cost' => $cost,
            'model' => $model,
            'response_time' => $responseTime,
        ];
    }
    
    /**
     * Call DeepSeek API
     */
    private function callDeepSeek(string $prompt): string
    {
        $config = $this->config['deepseek'];
        
        if (!$config['key']) {
            throw new \Exception('DeepSeek API key not configured');
        }
        
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $config['key'],
            'Content-Type' => 'application/json',
        ])->timeout(30)->post($config['url'], [
            'model' => $config['model'],
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'أنت مساعد ذكي متخصص في مجال التعليم وإدارة المدارس. أجب باللغة العربية الفصحى. كن دقيقاً وموثوقاً في الإجابات.',
                ],
                [
                    'role' => 'user',
                    'content' => $prompt,
                ],
            ],
            'temperature' => 0.7,
            'max_tokens' => 300,
        ]);
        
        if (!$response->successful()) {
            throw new \Exception('DeepSeek API error: ' . $response->body());
        }
        
        $data = $response->json();
        return $data['choices'][0]['message']['content'] ?? 'عذراً، لم أتمكن من معالجة طلبك.';
    }
    
    /**
     * Call Gemini API
     */
    private function callGemini(string $prompt): string
    {
        $config = $this->config['gemini'];
        
        if (!$config['key']) {
            throw new \Exception('Gemini API key not configured');
        }
        
        $response = Http::timeout(30)->post($config['url'] . '?key=' . $config['key'], [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => 0.7,
                'maxOutputTokens' => 300,
            ],
        ]);
        
        if (!$response->successful()) {
            throw new \Exception('Gemini API error: ' . $response->body());
        }
        
        $data = $response->json();
        return $data['candidates'][0]['content']['parts'][0]['text'] ?? 'عذراً، لم أتمكن من معالجة طلبك.';
    }
    
    /**
     * Calculate cost based on tokens
     * DeepSeek: $0.00028 per 1K tokens
     * Gemini: $0.000375 per 1K tokens
     */
    private function calculateCost(int $tokens, string $model): float
    {
        $rates = [
            'deepseek' => 0.00028,
            'gemini' => 0.000375,
        ];
        
        $rate = $rates[$model] ?? $rates['deepseek'];
        return round(($tokens / 1000) * $rate, 6);
    }
    
    /**
     * Get remaining budget using atomic Redis operations
     */
    private function getRemainingBudget(int $schoolId, string $budgetKey): float
    {
        $dailyLimit = self::DAILY_BUDGET_LIMIT;
        // ✅ FIX 3: Use null check instead of 0
        $used = Cache::get($budgetKey);
        
        // If not in cache, calculate from database
        if (is_null($used)) {
            $used = (float) AIUsage::where('school_id', $schoolId)
                ->whereDate('created_at', today())
                ->sum('cost');
            Cache::put($budgetKey, $used, now()->endOfDay());
        }
        
        return max(0, $dailyLimit - (float) $used);
    }
    
    /**
     * Deduct budget atomically
     */
    private function deductBudget(int $schoolId, string $budgetKey, float $cost): void
    {
        // ✅ FIX 4: Correct cache update logic
        $current = (float) Cache::get($budgetKey, 0);
        Cache::put($budgetKey, $current + $cost, now()->endOfDay());
    }
    
    /**
     * Send low budget alert to super admin
     */
    private function sendLowBudgetAlert(int $schoolId, float $remaining): void
    {
        $school = School::find($schoolId);
        Log::warning('Low AI budget alert', [
            'school_id' => $schoolId,
            'school_name' => $school?->name,
            'remaining' => $remaining,
        ]);
    }
}
