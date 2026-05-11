<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('uuid_generate_v4()'));
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('class_id');
            $table->unsignedBigInteger('recorded_by');
            $table->date('date');
            $table->enum('status', ['present', 'absent', 'late', 'excused', 'sick', 'holiday'])->default('absent');
            $table->time('check_in_time')->nullable();
            $table->time('check_out_time')->nullable();
            $table->string('check_in_method', 50)->nullable(); // manual, qr, nfc, telegram
            $table->string('check_out_method', 50)->nullable();
            $table->decimal('late_minutes', 5, 2)->default(0);
            $table->text('absence_reason')->nullable();
            $table->string('absence_document')->nullable();
            $table->json('metadata')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Foreign keys
            $table->foreign('school_id')->references('id')->on('schools')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->foreign('class_id')->references('id')->on('classes')->onDelete('cascade');
            $table->foreign('recorded_by')->references('id')->on('users')->onDelete('cascade');
            
            // Indexes
            $table->index(['school_id', 'date']);
            $table->index(['student_id', 'date']);
            $table->index(['class_id', 'date']);
            $table->index('date');
            $table->index('status');
            $table->index('check_in_time');
            $table->index('deleted_at');
            
            // Composite indexes
            $table->index(['school_id', 'class_id', 'date']);
            $table->index(['school_id', 'student_id', 'date']);
            $table->index(['student_id', 'date', 'status']);
            
            // Unique constraint to prevent duplicate attendance per day
            $table->unique(['student_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance');
    }
};
