// app/Models/School.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class School extends Model
{
    use HasFactory;

    protected $table = 'schools';

    protected $fillable = [
        'subdomain',
        'name',
        'logo_url',
        'subscription_plan',
        'subscription_status',
        'ai_daily_budget',
        'telegram_bot_token',
        'settings',
    ];

    protected $casts = [
        'settings' => 'json',
        'ai_daily_budget' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function teachers(): HasMany
    {
        return $this->hasMany(Teacher::class);
    }

    public function classes(): HasMany
    {
        return $this->hasMany(ClassModel::class);
    }

    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function announcements(): HasMany
    {
        return $this->hasMany(Announcement::class);
    }

    public function aiUsages(): HasMany
    {
        return $this->hasMany(AIUsage::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('subscription_status', 'active');
    }

    public function scopeBySubdomain($query, $subdomain)
    {
        return $query->where('subdomain', $subdomain);
    }

    // Helper Methods
    public function isSubscriptionActive(): bool
    {
        return $this->subscription_status === 'active';
    }

    public function getAIDailyBudget(): float
    {
        return (float) $this->ai_daily_budget;
    }

    public function getRemainingAIBudgetForToday(): float
    {
        $todayUsage = $this->aiUsages()
            ->whereDate('created_at', today())
            ->sum('cost');
        
        return $this->getAIDailyBudget() - $todayUsage;
    }

    public function hasAIBudgetRemaining(): bool
    {
        return $this->getRemainingAIBudgetForToday() > 0;
    }
}