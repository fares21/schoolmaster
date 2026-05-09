// app/Models/User.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'users';

    protected $fillable = [
        'school_id',
        'email',
        'password_hash',
        'role',
        'full_name',
        'telegram_chat_id',
        'is_active',
        'last_login_at',
    ];

    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_login_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function teacher(): HasOne
    {
        return $this->hasOne(Teacher::class);
    }

    public function student(): HasOne
    {
        return $this->hasOne(Student::class, 'parent_id');
    }

    public function parentStudents(): HasMany
    {
        return $this->hasMany(ParentStudent::class, 'parent_id');
    }

    public function recordedAttendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'recorded_by');
    }

    public function createdAnnouncements(): HasMany
    {
        return $this->hasMany(Announcement::class, 'created_by');
    }

    public function aiUsages(): HasMany
    {
        return $this->hasMany(AIUsage::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    // Role Check Methods
    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    public function isSchoolAdmin(): bool
    {
        return $this->role === 'school_admin';
    }

    public function isTeacher(): bool
    {
        return $this->role === 'teacher';
    }

    public function isStudent(): bool
    {
        return $this->role === 'student';
    }

    public function isParent(): bool
    {
        return $this->role === 'parent';
    }

    // Permission Methods
    public function canAccessAI(): bool
    {
        // Strict policy: Only school_admin can access AI
        return $this->isSchoolAdmin() && $this->is_active;
    }

    public function canManageUsers(): bool
    {
        return $this->isSuperAdmin() || ($this->isSchoolAdmin() && $this->is_active);
    }

    public function canManageAttendance(): bool
    {
        return $this->isSuperAdmin() || $this->isSchoolAdmin() || ($this->isTeacher() && $this->is_active);
    }

    // Helper Methods
    public function getFullNameAttribute(): string
    {
        return $this->full_name;
    }

    public function getAuthPassword()
    {
        return $this->password_hash;
    }
}