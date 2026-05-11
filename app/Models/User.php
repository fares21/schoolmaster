<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Support\Str;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes, HasRoles;

    protected $table = 'users';

    protected $guard_name = 'api';

    protected $fillable = [
        'uuid',
        'school_id',
        'national_id',
        'email',
        'phone',
        'username',
        'password',
        'first_name',
        'last_name',
        'middle_name',
        'gender',
        'birth_date',
        'profile_photo',
        'status',
        'email_verified_at',
        'phone_verified_at',
        'last_login_at',
        'last_login_ip',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
        'two_factor_method',
        'telegram_chat_id',
        'telegram_username',
        'preferences',
        'metadata',
        'remember_token',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'deleted_at',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'phone_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'birth_date' => 'date',
        'preferences' => 'array',
        'metadata' => 'array',
        'two_factor_confirmed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $appends = [
        'full_name',
        'role',
        'is_active',
        'avatar_url',
    ];

    // ========== Global Scopes for Tenant Isolation ==========
    
    protected static function booted()
    {
        static::addGlobalScope('tenant', function (Builder $builder) {
            if (auth()->check() && !auth()->user()->isSuperAdmin()) {
                $builder->where('school_id', auth()->user()->school_id);
            }
        });
        
        static::creating(function ($user) {
            if (empty($user->uuid)) {
                $user->uuid = (string) Str::uuid();
            }
            
            if (empty($user->password)) {
                $user->password = bcrypt(Str::random(16));
            }
        });
    }

    // ========== Relationships ==========
    
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'id', 'user_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'id', 'user_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Parents::class, 'id', 'user_id');
    }

    public function recordedAttendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'recorded_by');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    // ========== Accessors ==========
    
    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function getRoleAttribute(): string
    {
        return $this->roles->first()?->name ?? 'user';
    }

    public function getIsActiveAttribute(): bool
    {
        return $this->status === 'active';
    }

    public function getAvatarUrlAttribute(): string
    {
        if ($this->profile_photo) {
            return asset('storage/' . $this->profile_photo);
        }
        
        return 'https://ui-avatars.com/api/?name=' . urlencode($this->full_name) . '&background=random';
    }

    // ========== Scopes ==========
    
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeBySchool($query, int $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }

    public function scopeByRole($query, string $role)
    {
        return $query->role($role);
    }

    // ========== Methods ==========
    
    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super_admin');
    }

    public function isSchoolAdmin(): bool
    {
        return $this->hasRole('school_admin');
    }

    public function isTeacher(): bool
    {
        return $this->hasRole('teacher');
    }

    public function isStudent(): bool
    {
        return $this->hasRole('student');
    }

    public function isParent(): bool
    {
        return $this->hasRole('parent');
    }

    public function canAccessSchool(int $schoolId): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }
        
        return $this->school_id === $schoolId;
    }

    public function recordLogin(): void
    {
        $this->update([
            'last_login_at' => now(),
            'last_login_ip' => request()->ip(),
        ]);
    }

    public function hasTwoFactorEnabled(): bool
    {
        return !is_null($this->two_factor_confirmed_at);
    }

    public function enableTwoFactor(string $method): void
    {
        $this->update([
            'two_factor_method' => $method,
            'two_factor_confirmed_at' => now(),
        ]);
    }

    public function disableTwoFactor(): void
    {
        $this->update([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_method' => null,
            'two_factor_confirmed_at' => null,
        ]);
    }

    public function getPermissions(): array
    {
        return $this->getAllPermissions()->pluck('name')->toArray();
    }

    // ========== Authentication ==========
    
    public function routeNotificationForTelegram(): ?string
    {
        return $this->telegram_chat_id;
    }

    public function generateNewApiToken(): string
    {
        $token = $this->createToken('auth-token', ['*'])->plainTextToken;
        return $token;
    }

    public function revokeAllTokens(): void
    {
        $this->tokens()->delete();
    }
}
