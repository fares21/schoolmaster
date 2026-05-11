<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schools', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('uuid_generate_v4()'));
            $table->string('subdomain', 100)->unique();
            $table->string('custom_domain', 255)->unique()->nullable();
            $table->string('name_ar', 255);
            $table->string('name_en', 255);
            $table->string('registration_number', 50)->unique();
            $table->string('logo_url')->nullable();
            $table->string('favicon_url')->nullable();
            $table->json('theme_settings')->nullable();
            
            // Contact information
            $table->string('email', 191)->unique();
            $table->string('phone', 20);
            $table->string('mobile', 20)->nullable();
            $table->string('fax', 20)->nullable();
            $table->text('address_ar');
            $table->text('address_en')->nullable();
            $table->string('city', 100);
            $table->string('state', 100);
            $table->string('postal_code', 20)->nullable();
            $table->string('country', 100)->default('Saudi Arabia');
            
            // Status and subscription
            $table->enum('status', ['active', 'inactive', 'suspended', 'pending', 'trial'])->default('pending');
            $table->enum('subscription_status', ['active', 'expired', 'cancelled', 'grace_period'])->default('grace_period');
            $table->timestamp('subscription_expires_at')->nullable();
            $table->timestamp('trial_ends_at')->nullable();
            $table->unsignedBigInteger('subscription_plan_id')->nullable();
            
            // Limits and quotas
            $table->integer('student_limit')->default(500);
            $table->integer('teacher_limit')->default(50);
            $table->integer('ai_daily_tokens_limit')->default(50000);
            $table->bigInteger('storage_limit_bytes')->default(1073741824); // 1GB
            
            // AI Settings
            $table->json('ai_settings')->nullable();
            
            // Telegram integration
            $table->string('telegram_bot_token')->nullable();
            $table->string('telegram_bot_username')->nullable();
            $table->string('telegram_group_id')->nullable();
            
            // Settings
            $table->json('settings')->nullable();
            $table->json('features')->nullable();
            $table->json('custom_fields')->nullable();
            
            // Timestamps
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['status', 'subscription_status']);
            $table->index('subdomain');
            $table->index('custom_domain');
            $table->index('registration_number');
            $table->index('subscription_expires_at');
            $table->index('trial_ends_at');
            $table->index('deleted_at');
        });

        // إضافة الفهارس المتقدمة
        DB::statement('CREATE INDEX idx_schools_status_subscription ON schools(status, subscription_status) WHERE deleted_at IS NULL');
        DB::statement('CREATE INDEX idx_schools_city_status ON schools(city, status) WHERE status = \'active\'');
    }

    public function down(): void
    {
        Schema::dropIfExists('schools');
    }
};
