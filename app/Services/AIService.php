<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;
use App\Models\School;
use App\Models\AIConsumption;
use App\Events\AITokensExhausted;
use Exception;

class AIService
{
    private const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
    private const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    private const TOKEN_BUFFER_PERCENTAGE = 10; // 10% safety margin
    
    private string $primaryProvider = 'deepseek';
    private string $fallbackProvider = 'gemini';
    
    public function __construct(
        private readonly AuditService $auditService
    ) {}
    
    public function askAssistant(School $school, string $prompt, array $context = []): array
    {
        // Validate school has AI tokens available
        $remainingTokens = $school->getRemainingAITokensForToday();
        
        if ($remainingTokens <= 0) {
            event(new AITokensExhausted($school));
            throw new AIServiceException(
                'School AI token limit exceeded for today',
                AIServiceException::TOKEN_LIMIT_EXCEEDED
            );
        }
        
        // Calculate estimated tokens
        $estimatedTokens = $this->calculateTokens($prompt, $context);
        $estimatedTokensWithBuffer = ceil($estimatedTokens * (1 + self::TOKEN_BUFFER_PERCENTAGE / 100));
        
        // Reserve tokens atomically
        $reserved = $this->reserveTokens($school->id, $estimatedTokensWithBuffer);
        
        if (!$reserved) {
            throw new AIServiceException(
                'Failed to reserve tokens for AI request',
                AIServiceException::TOKEN_RESERVATION_FAILED
            );
        }
        
        try {
            // Try primary provider with retry
            $response = $this->callWithRetry($school, $prompt, $context);
            
            // Calculate actual tokens used
            $actualTokens = $this->calculateTokens($prompt, $response);
            
            // Adjust consumption
            $this->adjustTokens($school->id, $estimatedTokensWithBuffer, $actualTokens);
            
            // Log consumption
            $this->logConsumption($school, $prompt, $response, $actualTokens);
            
            return [
                'success' => true,
                'response' => $response['content'],
                'tokens_used' => $actualTokens,
                'provider' => $response['provider'],
                'model' => $response['model'],
            ];
            
        } catch (Exception $e) {
            // Release reserved tokens on failure
            $this->releaseReservedTokens($school->id, $estimatedTokensWithBuffer);
            
            throw new AIServiceException(
                'AI service failed: ' . $e->getMessage(),
                AIServiceException::SERVICE_FAILED,
                $e
            );
        }
    }
    
    private function callWithRetry(School $school, string $prompt, array $context, int $attempt = 1): array
    {
        $providers = [$this->primaryProvider];
        
        // Add fallback on retry
        if ($attempt > 1) {
            $providers[] = $this->fallbackProvider;
        }
        
        foreach ($providers as $provider) {
            try {
                return match ($provider) {
                    'deepseek' => $this->callDeepSeek($prompt, $context),
                    'gemini' => $this->callGemini($prompt, $context),
                    default => throw new Exception("Unknown provider: $provider"),
                };
            } catch (Exception $e) {
                Log::warning("AI provider failed: $provider", [
                    'school_id' => $school->id,
                    'error' => $e->getMessage(),
                    'attempt' => $attempt,
                ]);
                
                if ($attempt >= 3) {
                    throw $e;
                }
                
                // Wait before retry (exponential backoff)
                usleep(1000000 * $attempt); // 1s, 2s, 3s
                
                return $this->callWithRetry($school, $prompt, $context, $attempt + 1);
            }
        }
        
        throw new Exception('All AI providers failed');
    }
    
    private function callDeepSeek(string $prompt, array $context): array
    {
        $systemPrompt = $this->buildSystemPrompt($context);
        
        $response = Http::timeout(30)
            ->retry(3, 1000)
            ->withToken(config('services.deepseek.api_key'))
            ->post(self::DEEPSEEK_URL, [
                'model' => 'deepseek-chat',
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'temperature' => 0.7,
                'max_tokens' => 4096,
            ]);
        
        if (!$response->successful()) {
            $this->logApiError('deepseek', $response);
            throw new Exception('DeepSeek API error: ' . $response->status());
        }
        
        $data = $response->json();
        
        return [
            'content' => $data['choices'][0]['message']['content'],
            'provider' => 'deepseek',
            'model' => $data['model'],
        ];
    }
    
    private function callGemini(string $prompt, array $context): array
    {
        $apiKey = config('services.gemini.api_key');
        $url = self::GEMINI_URL . '?key=' . $apiKey;
        
        $systemPrompt = $this->buildSystemPrompt($context);
        $fullPrompt = $systemPrompt . "\n\nالمستخدم: " . $prompt;
        
        $response = Http::timeout(30)
            ->retry(3, 1000)
            ->post($url, [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $fullPrompt],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'temperature' => 0.7,
                    'maxOutputTokens' => 4096,
                ],
            ]);
        
        if (!$response->successful()) {
            $this->logApiError('gemini', $response);
            throw new Exception('Gemini API error: ' . $response->status());
        }
        
        $data = $response->json();
        
        return [
            'content' => $data['candidates'][0]['content']['parts'][0]['text'],
            'provider' => 'gemini',
            'model' => 'gemini-pro',
        ];
    }
    
    private function buildSystemPrompt(array $context): string
    {
        $defaultPrompt = "أنت مساعد مدرسة ذكي. أنت تجيب باللغة العربية الفصحى فقط.
        أنت مهذب، دقيق، ومفيد. إذا لم تكن متأكداً من إجابة، قل ذلك بصراحة.
        لا تقدم معلومات غير دقيقة أو ضارة.";
        
        if (!empty($context['school_name'])) {
            $defaultPrompt .= "\n\nأنت تقدم المساعدة لمدرسة: {$context['school_name']}.";
        }
        
        if (!empty($context['student_name'])) {
            $defaultPrompt .= "\n\nتتحدث حالياً مع الطالب: {$context['student_name']}.";
        }
        
        if (!empty($context['academic_year'])) {
            $defaultPrompt .= "\n\nالعام الدراسي الحالي: {$context['academic_year']}.";
        }
        
        return $defaultPrompt;
    }
    
    private function calculateTokens(string $prompt, array|string $response): int
    {
        // Use a tokenization library or approximation
        // For Arabic, approximate tokens = characters / 3.5
        $promptChars = mb_strlen($prompt);
        $promptTokens = (int) ceil($promptChars / 3.5);
        
        $responseText = is_array($response) ? ($response['content'] ?? json_encode($response)) : $response;
        $responseChars = mb_strlen($responseText);
        $responseTokens = (int) ceil($responseChars / 3.5);
        
        return $promptTokens + $responseTokens;
    }
    
    private function reserveTokens(int $schoolId, int $tokens): bool
    {
        $today = now()->toDateString();
        $key = "ai_tokens:{$schoolId}:{$today}";
        
        // In production, use proper Redis atomic operations
        $current = Redis::incrby($key, $tokens);
        
        // Get school token limit
        $school = School::find($schoolId);
        $limit = $school->ai_daily_tokens_limit ?? 50000;
        
        if ($current > $limit) {
            // Rollback
            Redis::decrby($key, $tokens);
            return false;
        }
        
        Redis::expire($key, 86400); // 24 hours
        
        return true;
    }
    
    private function adjustTokens(int $schoolId, int $reserved, int $actual): void
    {
        $today = now()->toDateString();
        $key = "ai_tokens:{$schoolId}:{$today}";
        
        $difference = $reserved - $actual;
        
        if ($difference > 0) {
            // Less tokens used than reserved, return the difference
            Redis::decrby($key, $difference);
        } elseif ($difference < 0) {
            // More tokens used than reserved, this shouldn't happen with buffer
            Redis::incrby($key, abs($difference));
        }
    }
    
    private function releaseReservedTokens(int $schoolId, int $tokens): void
    {
        $today = now()->toDateString();
        $key = "ai_tokens:{$schoolId}:{$today}";
        Redis::decrby($key, $tokens);
    }
    
    private function logConsumption(School $school, string $prompt, array $response, int $tokensUsed): void
    {
        AIConsumption::create([
            'school_id' => $school->id,
            'tokens_used' => $tokensUsed,
            'prompt_length' => mb_strlen($prompt),
            'response_length' => mb_strlen($response['content']),
            'provider' => $response['provider'],
            'model' => $response['model'],
            'endpoint' => 'chat_completion',
            'metadata' => [
                'prompt_preview' => mb_substr($prompt, 0, 200),
                'response_preview' => mb_substr($response['content'], 0, 200),
            ],
        ]);
        
        $this->auditService->log(
            $school->id ?? null,
            'ai_consumption',
            'ai',
            $response['provider'],
            ['tokens' => $tokensUsed]
        );
    }
    
    private function logApiError(string $provider, $response): void
    {
        Log::error('AI API Error', [
            'provider' => $provider,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);
    }
}

class AIServiceException extends Exception
{
    public const TOKEN_LIMIT_EXCEEDED = 'token_limit_exceeded';
    public const TOKEN_RESERVATION_FAILED = 'token_reservation_failed';
    public const SERVICE_FAILED = 'service_failed';
    
    public function __construct(
        string $message,
        public readonly string $errorCode,
        ?Exception $previous = null
    ) {
        parent::__construct($message, 0, $previous);
    }
}
