<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('uuid_generate_v4()'));
            $table->unsignedBigInteger('school_id')->nullable();
            $table->string('national_id', 20)->unique()->nullable();
            $table->string('email', 191)->unique();
            $table->string('phone', 20)->unique()->nullable();
            $table->string('username', 50)->unique()->nullable();
            $table->string('password');
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->enum('gender', ['male', 'female'])->nullable();
            $table->date('birth_date')->nullable();
            $table->string('profile_photo')->nullable();
            $table->enum('status', ['active', 'inactive', 'suspended', 'pending'])->default('pending');
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('phone_verified_at')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->string('last_login_ip', 45)->nullable();
            $table->text('two_factor_secret')->nullable();
            $table->text('two_factor_recovery_codes')->nullable();
            $table->timestamp('two_factor_confirmed_at')->nullable();
            $table->enum('two_factor_method', ['email', 'phone', 'telegram'])->nullable();
            $table->string('telegram_chat_id', 50)->nullable();
            $table->string('telegram_username')->nullable();
            $table->json('preferences')->nullable();
            $table->json('metadata')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
            
            // Foreign keys
            $table->foreign('school_id')
                  ->references('id')
                  ->on('schools')
                  ->onDelete('set null');
            
            // Indexes
            $table->index(['school_id', 'status']);
            $table->index('email');
            $table->index('phone');
            $table->index('national_id');
            $table->index('username');
            $table->index('status');
            $table->index('deleted_at');
            $table->index('last_login_at');
            $table->index('telegram_chat_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
