// database/migrations/2024_01_01_000003_create_students_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade');
            $table->string('student_code')->unique();
            $table->string('full_name');
            $table->foreignId('parent_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('class_id')->nullable()->constrained('classes');
            $table->date('enrollment_date');
            $table->date('birth_date')->nullable();
            $table->string('address')->nullable();
            $table->string('parent_name')->nullable();
            $table->string('parent_phone')->nullable();
            $table->string('parent_email')->nullable();
            $table->enum('status', ['active', 'inactive', 'graduated', 'transferred'])->default('active');
            $table->timestamps();
            
            $table->index(['school_id', 'student_code']);
            $table->index('class_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};