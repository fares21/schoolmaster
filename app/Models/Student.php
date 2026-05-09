// app/Models/Student.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Student extends Model
{
    use HasFactory;

    protected $table = 'students';

    protected $fillable = [
        'school_id',
        'student_code',
        'full_name',
        'parent_id',
        'class_id',
        'enrollment_date',
        'birth_date',
        'address',
        'parent_name',
        'parent_phone',
        'parent_email',
        'status',
    ];

    protected $casts = [
        'enrollment_date' => 'date',
        'birth_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'parent_id');
    }

    public function class(): BelongsTo
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByClass($query, $classId)
    {
        return $query->where('class_id', $classId);
    }

    // Helper Methods
    public function getTodayAttendance(): ?Attendance
    {
        return $this->attendances()
            ->whereDate('date', today())
            ->first();
    }

    public function getAttendanceRateForMonth(): float
    {
        $total = $this->attendances()
            ->whereMonth('date', now()->month)
            ->count();
        
        if ($total === 0) return 0;
        
        $present = $this->attendances()
            ->whereMonth('date', now()->month)
            ->where('status', 'present')
            ->count();
        
        return round(($present / $total) * 100, 2);
    }

    public function getAverageGrade(): float
    {
        $grades = $this->grades()
            ->selectRaw('AVG(score) as average')
            ->first();
        
        return round($grades->average ?? 0, 2);
    }
}