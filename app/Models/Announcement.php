// app/Models/Announcement.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Announcement extends Model
{
    use HasFactory;

    protected $table = 'announcements';

    protected $fillable = [
        'school_id',
        'created_by',
        'type',
        'title',
        'content',
        'priority',
        'target_type',
        'target_ids',
        'send_web',
        'send_telegram',
        'send_email',
        'expires_at',
        'is_active',
    ];

    protected $casts = [
        'target_ids' => 'json',
        'send_web' => 'boolean',
        'send_telegram' => 'boolean',
        'send_email' => 'boolean',
        'is_active' => 'boolean',
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Type constants
    const TYPE_SCHOOL = 'school';
    const TYPE_CLASS = 'class';
    const TYPE_PARENT = 'parent';
    const TYPE_SYSTEM = 'system';

    // Priority constants
    const PRIORITY_LOW = 'low';
    const PRIORITY_MEDIUM = 'medium';
    const PRIORITY_HIGH = 'high';
    const PRIORITY_URGENT = 'urgent';

    // Target type constants
    const TARGET_ALL = 'all';
    const TARGET_ROLE = 'role';
    const TARGET_CLASS = 'class';
    const TARGET_SPECIFIC = 'specific_users';

    // Relationships
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function views(): HasMany
    {
        return $this->hasMany(AnnouncementView::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    // Helper Methods
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function getViewCount(): int
    {
        return $this->views()->count();
    }

    public function getViewRate(): float
    {
        // This will be calculated based on total recipients
        return 0;
    }

    public function getPriorityColor(): string
    {
        return match($this->priority) {
            self::PRIORITY_URGENT => 'red',
            self::PRIORITY_HIGH => 'orange',
            self::PRIORITY_MEDIUM => 'blue',
            default => 'gray',
        };
    }
}