// database/migrations/2024_01_01_000007_create_announcements_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users');
            $table->enum('type', ['school', 'class', 'parent', 'system'])->default('school');
            $table->string('title');
            $table->text('content');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->enum('target_type', ['all', 'role', 'class', 'specific_users'])->default('all');
            $table->json('target_ids')->nullable();
            $table->boolean('send_web')->default(true);
            $table->boolean('send_telegram')->default(false);
            $table->boolean('send_email')->default(false);
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index(['school_id', 'type']);
            $table->index(['school_id', 'is_active']);
            $table->index('expires_at');
        });
        
        Schema::create('announcement_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('announcement_id')->constrained('announcements')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamp('viewed_at')->useCurrent();
            
            $table->unique(['announcement_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('announcement_views');
        Schema::dropIfExists('announcements');
    }
};