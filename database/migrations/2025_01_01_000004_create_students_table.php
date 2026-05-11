<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('uuid_generate_v4()'));
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('class_id')->nullable();
            $table->string('student_code', 50)->unique();
            $table->string('national_id', 20)->unique()->nullable();
            $table->string('first_name_ar', 100);
            $table->string('last_name_ar', 100);
            $table->string('first_name_en', 100);
            $table->string('last_name_en', 100);
            $table->string('father_name', 100)->nullable();
            $table->string('mother_name', 100)->nullable();
            $table->enum('gender', ['male', 'female']);
            $table->date('birth_date');
            $table->string('birth_place', 100)->nullable();
            $table->string('nationality', 100)->default('Saudi');
            $table->string('religion', 50)->nullable();
            
            // Contact
            $table->string('phone', 20)->nullable();
            $table->string('mobile', 20)->nullable();
            $table->string('email', 191)->unique()->nullable();
            $table->text('address')->nullable();
            
            // Academic
            $table->string('academic_year', 20);
            $table->string('roll_number', 50)->nullable();
            $table->date('enrollment_date');
            $table->enum('enrollment_status', ['active', 'graduated', 'transferred', 'suspended', 'expelled'])->default('active');
            $table->text('enrollment_notes')->nullable();
            
            // Medical
            $table->json('medical_info')->nullable();
            $table->json('allergies')->nullable();
            $table->json('chronic_diseases')->nullable();
            $table->string('blood_type', 5)->nullable();
            
            // Emergency contact
            $table->json('emergency_contacts')->nullable();
            
            // Parent linkage
            $table->unsignedBigInteger('parent_id')->nullable();
            
            // QR Code
            $table->string('qr_code')->nullable();
            
            // Additional
            $table->json('documents')->nullable();
            $table->json('attachments')->nullable();
            $table->json('custom_fields')->nullable();
            $table->text('notes')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Foreign keys
            $table->foreign('school_id')->references('id')->on('schools')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('class_id')->references('id')->on('classes')->onDelete('set null');
            $table->foreign('parent_id')->references('id')->on('parents')->onDelete('set null');
            
            // Indexes
            $table->index(['school_id', 'student_code']);
            $table->index(['school_id', 'class_id']);
            $table->index(['school_id', 'enrollment_status']);
            $table->index('national_id');
            $table->index('email');
            $table->index('qr_code');
            $table->index('academic_year');
            $table->index('birth_date');
            $table->index('deleted_at');
            
            // Composite indexes
            $table->index(['school_id', 'enrollment_status', 'class_id']);
            $table->index(['school_id', 'academic_year', 'class_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
