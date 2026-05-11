<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class School extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'schools';

    protected $fillable = [
        'uuid',
        'subdomain',
        'custom_domain',
        'name_ar',
        'name_en',
        'registration_number',
        'logo_url',
        'favicon_url',
        'theme_settings',
        'email',
        'phone',
        'mobile',
        'fax',
        'address_ar',
        'address_en',
        'city',
        'state',
        'postal_code',
        'country',
        'status',
        'subscription_status',
        'subscription_expires_at',
        'trial_ends_at',
        'subscription_plan_id',
        'student_limit',
        'teacher_limit',
        'ai_daily_tokens_limit',
        'storage_limit_bytes',
        'ai_settings',
        'telegram_bot_token',
        'telegram_bot_username',
        'telegram_group_id',
        'settings',
        'features',
        'custom_fields',
    ];

    protected $casts = [
        'theme_settings' => 'array',
        'ai_settings' => 'array',
        'settings' => 'array',
        'features' => 'array',
        'custom_fields' => 'array',
        'subscription_expires_at' => 'datetime',
        'trial_ends_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        'student_limit' => 'integer',
        'teacher_limit' => 'integer',
        'ai_daily_tokens_limit' => 'integer',
        'storage_limit_bytes' => 'integer',
    ];

    protected $hidden = [
        'telegram_bot_token',
        'deleted_at',
    ];

    protected $appends = [
        'full_name',
        'is_active',
        'is_subscription_valid',
        'remaining_days',
    ];

    // ========== Relationships ==========
    
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

    public function parents(): HasMany
    {
        return $this->hasMany(Parents::class);
    }

    public function classes(): HasMany
    {
        return $this->hasMany(Classes::class);
    }

    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class);
    }

    public function attendance(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }

    public function announcements(): HasMany
    {
        return $this->hasMany(Announcement::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function aiConsumptions(): HasMany
    {
        return $this->hasMany(AIConsumption::class);
    }

    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class)->latest();
    }

    public function subscriptionPlan(): HasOne
    {
        return $this->hasOne(SubscriptionPlan::class, 'id', 'subscription_plan_id');
    }

    // ========== Accessors ==========
    
    public function getFullNameAttribute(): string
    {
        return "{$this->name_ar} ({$this->name_en})";
    }

    public function getIsActiveAttribute(): bool
    {
        return $this->status === 'active';
    }

    public function getIsSubscriptionValidAttribute(): bool
    {
        if ($this->subscription_status !== 'active') {
            return false;
        }
        
        if ($this->subscription_expires_at && $this->subscription_expires_at->isPast()) {
            return false;
        }
        
        return true;
    }

    public function getRemainingDaysAttribute(): ?int
    {
        if (!$this->subscription_expires_at) {
            return null;
        }
        
        return now()->diffInDays($this->subscription_expires_at, false);
    }

    // ========== Scopes ==========
    
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeSubscribed($query)
    {
        return $query->where('subscription_status', 'active')
                     ->where(function ($q) {
                         $q->whereNull('subscription_expires_at')
                           ->orWhere('subscription_expires_at', '>', now());
                     });
    }

    public function scopeBySubdomain($query, string $subdomain)
    {
        return $query->where('subdomain', $subdomain)
                     ->orWhere('custom_domain', $subdomain);
    }

    // ========== Methods ==========
    
    public function hasFeature(string $feature): bool
    {
        return $this->features && in_array($feature, $this->features);
    }

    public function canAddMoreStudents(): bool
    {
        return $this->students()->count() < $this->student_limit;
    }

    public function canAddMoreTeachers(): bool
    {
        return $this->teachers()->count() < $this->teacher_limit;
    }

    public function getRemainingAITokensForToday(): int
    {
        $today = now()->toDateString();
        
        $used = AIConsumption::where('school_id', $this->id)
            ->whereDate('created_at', $today)
            ->sum('tokens_used');
        
        return max(0, $this->ai_daily_tokens_limit - $used);
    }

    public function getStorageUsage(): array
    {
        // Logic to calculate storage usage from filesystem
        return [
            'used_bytes' => 0,
            'limit_bytes' => $this->storage_limit_bytes,
            'percentage' => 0,
        ];
    }

    public function getDashboardStats(): array
    {
        return [
            'total_students' => $this->students()->count(),
            'total_teachers' => $this->teachers()->count(),
            'total_parents' => $this->parents()->count(),
            'total_classes' => $this->classes()->count(),
            'today_attendance' => Attendance::where('school_id', $this->id)
                ->whereDate('date', today())
                ->count(),
            'attendance_percentage' => $this->calculateAttendancePercentage(),
        ];
    }

    private function calculateAttendancePercentage(): float
    {
        $total = $this->students()->count();
        if ($total === 0) {
            return 0;
        }
        
        $present = Attendance::where('school_id', $this->id)
            ->whereDate('date', today())
            ->where('status', 'present')
            ->count();
        
        return round(($present / $total) * 100, 2);
    }

    // ========== Boot Methods ==========
    
    protected static function booted()
    {
        static::creating(function ($school) {
            if (empty($school->uuid)) {
                $school->uuid = (string) Str::uuid();
            }
        });
    }
}
