<?php

namespace App\Services\AI;

use App\Models\AiUsage;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * AIOrchestrator — Production-Grade AI Gateway
 *
 * Security guarantees:
 * 1. ONLY school_admin can call AI (enforced here AND in middleware)
 * 2. Atomic budget deduction via Redis WATCH/MULTI (no race condition)
 * 3. Token limit enforced BEFORE sending to provider
 * 4. DeepSeek → Gemini failover with full cost tracking
 * 5. Every request logged regardless of outcome
 */
final class AIOrchestrator
{
    private const DAILY_BUDGET     = 0.50;  // USD
    private const MAX_TOKENS       = 500;
    private const RATE_LIMIT_HOURS = 1;
    private const RATE_LIMIT_MAX   = 10;

    public function __construct(private readonly TokenCounter $tokenCounter) {}

    /**
     * Ask the AI a question.
     *
     * @throws \Exception on policy violations (budget, rate, token, role)
     */
    public function ask(User $user, string $question): array
    {
        // ── Guard 1: Role (double-check beyond middleware) ─────────────
        if ($user->role !== 'school_admin') {
            $this->logUsage($user, $question, null, 0, 0.0, false, 'ROLE_DENIED');
            throw new \DomainException('غير مصرح لك باستخدام الذكاء الاصطناعي', 403);
        }

        // ── Guard 2: Token limit BEFORE spending budget ────────────────
        $inputTokens = $this->tokenCounter->count($question);
        if ($inputTokens > self::MAX_TOKENS) {
            throw new \OverflowException("TOKEN_LIMIT_EXCEEDED:{$inputTokens}", 422);
        }

        // ── Guard 3: Per-user rate limit (atomic) ─────────────────────
        $this->checkRateLimit($user);

        // ── Guard 4: Budget check + atomic deduction ───────────────────
        $estimatedCost = $this->tokenCounter->estimateCost($inputTokens * 2, 'deepseek');
        $this->checkAndDeductBudget($user->school_id, $
