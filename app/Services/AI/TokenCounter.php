// app/Services/AI/TokenCounter.php
<?php

namespace App\Services\AI;

class TokenCounter
{
    /**
     * Accurate token counter for Arabic and multilingual text
     * Simulates GPT-2 BPE tokenizer behavior
     */
    public function countTokens(string $text): int
    {
        if (empty($text)) {
            return 0;
        }
        
        $tokenCount = 0;
        
        // Split by words and punctuation while preserving Arabic characters
        preg_match_all('/[\x{0600}-\x{06FF}\x{0750}-\x{077F}\x{08A0}-\x{08FF}\x{FB50}-\x{FDFF}\x{FE70}-\x{FEFF}a-zA-Z0-9]+|[^\s]/u', $text, $matches);
        $words = $matches[0] ?? [];
        
        foreach ($words as $word) {
            // Check if word contains Arabic characters
            $hasArabic = preg_match('/[\x{0600}-\x{06FF}\x{0750}-\x{077F}\x{08A0}-\x{08FF}]/u', $word);
            
            if ($hasArabic) {
                // Arabic: ~1 token per 3 characters
                $tokenCount += max(1, (int) ceil(mb_strlen($word) / 3));
            } elseif (preg_match('/[a-zA-Z]/', $word)) {
                // English: ~1 token per 4 characters
                $tokenCount += max(1, (int) ceil(strlen($word) / 4));
            } elseif (is_numeric($word)) {
                // Numbers: 1 token per digit
                $tokenCount += strlen($word);
            } else {
                // Punctuation and symbols: 1 token each
                $tokenCount += 1;
            }
        }
        
        // Add overhead for special tokens (system prompt, etc.)
        $tokenCount += 4;
        
        return $tokenCount;
    }
    
    /**
     * Estimate cost for a prompt
     */
    public function estimateCost(string $prompt, string $model = 'deepseek'): float
    {
        $tokens = $this->countTokens($prompt);
        $rates = [
            'deepseek' => 0.00028,
            'gemini' => 0.000375,
        ];
        
        $rate = $rates[$model] ?? $rates['deepseek'];
        return round(($tokens / 1000) * $rate, 6);
    }
    
    /**
     * Validate token limit
     */
    public function validateTokenLimit(string $text, int $limit = 500): bool
    {
        return $this->countTokens($text) <= $limit;
    }
    
    /**
     * Truncate text to fit token limit
     */
    public function truncateToTokenLimit(string $text, int $limit = 500): string
    {
        if ($this->validateTokenLimit($text, $limit)) {
            return $text;
        }
        
        $words = preg_split('/\s+/', $text);
        $truncated = '';
        
        foreach ($words as $word) {
            $test = $truncated . ' ' . $word;
            if ($this->countTokens($test) > $limit) {
                break;
            }
            $truncated = $test;
        }
        
        return trim($truncated) . '...';
    }
}