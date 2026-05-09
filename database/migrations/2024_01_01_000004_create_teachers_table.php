// database/migrations/2024_01_01_000004_create_teachers_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teachers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('subject');
            $table->date('hire_date');
            $table->timestamps();
            
            $table->index(['school_id', 'user_id']);
        });
        
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade');
            $table->string('name');
            $table->foreignId('teacher_id')->constrained('teachers')->onDelete('cascade');
            $table->text('description')->nullable();
            $table->timestamps();
            
            $table->index(['school_id', 'teacher_id']);
        });
        
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade');
            $table->string('name');
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->string('academic_year');
            $table->foreignId('teacher_id')->nullable()->constrained('teachers')->onDelete('set null');
            $table->string('room_number')->nullable();
            $table->integer('capacity')->nullable();
            $table->timestamps();
            
            $table->index(['school_id', 'academic_year']);
            $table->index('teacher_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('classes');
        Schema::dropIfExists('subjects');
        Schema::dropIfExists('teachers');
    }
};