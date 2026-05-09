// app/Models/ParentStudent.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParentStudent extends Model
{
    use HasFactory;

    protected $table = 'parent_students';

    protected $fillable = [
        'parent_id',
        'student_id',
        'relationship',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationship constants
    const RELATIONSHIP_FATHER = 'father';
    const RELATIONSHIP_MOTHER = 'mother';
    const RELATIONSHIP_GUARDIAN = 'guardian';

    // Relationships
    public function parent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'parent_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    // Helper Methods
    public function getRelationshipArabic(): string
    {
        return match($this->relationship) {
            self::RELATIONSHIP_FATHER => 'والد',
            self::RELATIONSHIP_MOTHER => 'والدة',
            self::RELATIONSHIP_GUARDIAN => 'وصي',
            default => $this->relationship,
        };
    }
}