// database/migrations/2024_01_01_000005_create_attendance_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('class_id')->constrained('classes')->onDelete('cascade');
            $table->date('date');
            $table->enum('status', ['present', 'absent', 'late', 'excused'])->default('present');
            $table->foreignId('recorded_by')->constrained('users');
            $table->text('message')->nullable();
            $table->timestamps();
            
            $table->index(['school_id', 'date']);
            $table->index(['student_id', 'date']);
            $table->index(['class_id', 'date']);
            $table->unique(['student_id', 'class_id', 'date'], 'unique_attendance');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance');
    }
};