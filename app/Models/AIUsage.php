// app/Models/AIUsage.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AIUsage extends Model
{
    use HasFactory;

    protected $table = 'ai_usages';

    protected $fillable = [
        'school_id',
        'user_id',
        'prompt',
        'response',
        'prompt_tokens',
        'completion_tokens',
        'total_tokens',
        'cost',
        'model_used',
        'response_time',
        'status',
        'error_message',
    ];

    protected $casts = [
        'prompt_tokens' => 'integer',
        'completion_tokens' => 'integer',
        'total_tokens' => 'integer',
        'cost' => 'decimal:6',
        'response_time' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Status constants
    const STATUS_SUCCESS = 'success';
    const STATUS_FAILED = 'failed';

    // Model constants
    const MODEL_DEEPSEEK = 'deepseek';
    const MODEL_GEMINI = 'gemini';

    // Relationships
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeToday($query)
    {
        return $query->whereDate('created_at', today());
    }

    public function scopeBySchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }

    public function scopeSuccessful($query)
    {
        return $query->where('status', self::STATUS_SUCCESS);
    }

    // Helper Methods
    public static function getTodayTotalCost($schoolId): float
    {
        return self::where('school_id', $schoolId)
            ->whereDate('created_at', today())
            ->sum('cost');
    }

    public static function getSchoolStats($schoolId)
    {
        return [
            'total_requests' => self::where('school_id', $schoolId)->count(),
            'total_cost' => self::where('school_id', $schoolId)->sum('cost'),
            'total_tokens' => self::where('school_id', $schoolId)->sum('total_tokens'),
            'avg_response_time' => self::where('school_id', $schoolId)->avg('response_time'),
        ];
    }
}