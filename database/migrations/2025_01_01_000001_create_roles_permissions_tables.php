<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const UPDATED_AT = 'updated_at';
    private const CREATED_AT = 'created_at';

    public function up(): void
    {
        // تشغيل UUID extension
        DB::statement('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

        // جدول الصلاحيات
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('uuid_generate_v4()'));
            $table->string('name', 125)->unique();
            $table->string('guard_name', 125)->default('api');
            $table->string('module', 50)->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
            
            // Indexes للسرعة
            $table->index(['guard_name', 'name']);
            $table->index('module');
        });

        // جدول الأدوار
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('uuid_generate_v4()'));
            $table->string('name', 125)->unique();
            $table->string('guard_name', 125)->default('api');
            $table->enum('level', ['system', 'school', 'class'])->default('school');
            $table->text('description')->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            
            // Indexes
            $table->index(['guard_name', 'name']);
            $table->index('level');
            $table->index('is_default');
        });

        // جدول ربط الأدوار بالصلاحيات
        Schema::create('role_has_permissions', function (Blueprint $table) {
            $table->unsignedBigInteger('permission_id');
            $table->unsignedBigInteger('role_id');
            
            $table->foreign('permission_id')
                  ->references('id')
                  ->on('permissions')
                  ->onDelete('cascade');
            
            $table->foreign('role_id')
                  ->references('id')
                  ->on('roles')
                  ->onDelete('cascade');
            
            $table->primary(['permission_id', 'role_id']);
        });

        // جدول ربط المستخدمين بالأدوار
        Schema::create('model_has_roles', function (Blueprint $table) {
            $table->unsignedBigInteger('role_id');
            $table->uuid('model_uuid');
            $table->string('model_type', 255);
            
            $table->foreign('role_id')
                  ->references('id')
                  ->on('roles')
                  ->onDelete('cascade');
            
            $table->index(['model_uuid', 'model_type']);
            $table->primary(['role_id', 'model_uuid', 'model_type']);
        });

        // جدول ربط المستخدمين بالصلاحيات المباشرة
        Schema::create('model_has_permissions', function (Blueprint $table) {
            $table->unsignedBigInteger('permission_id');
            $table->uuid('model_uuid');
            $table->string('model_type', 255);
            
            $table->foreign('permission_id')
                  ->references('id')
                  ->on('permissions')
                  ->onDelete('cascade');
            
            $table->index(['model_uuid', 'model_type']);
            $table->primary(['permission_id', 'model_uuid', 'model_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('model_has_permissions');
        Schema::dropIfExists('model_has_roles');
        Schema::dropIfExists('role_has_permissions');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('permissions');
    }
};
