// app/Models/ClassModel.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClassModel extends Model
{
    use HasFactory;

    protected $table = 'classes';

    protected $fillable = [
        'school_id',
        'name',
        'subject_id',
        'academic_year',
        'teacher_id',
        'room_number',
        'capacity',
    ];

    protected $casts = [
        'capacity' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }

    // Helper Methods
    public function getStudentCount(): int
    {
        return $this->students()->count();
    }

    public function getTodayAttendanceRate(): float
    {
        $total = $this->students()->count();
        if ($total === 0) return 0;
        
        $present = $this->attendances()
            ->whereDate('date', today())
            ->where('status', Attendance::STATUS_PRESENT)
            ->count();
        
        return round(($present / $total) * 100, 2);
    }

    public function getAverageGrade(): float
    {
        return round($this->grades()->avg('score') ?? 0, 2);
    }
}