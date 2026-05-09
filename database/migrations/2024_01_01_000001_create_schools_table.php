// database/migrations/2024_01_01_000001_create_schools_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schools', function (Blueprint $table) {
            $table->id();
            $table->string('subdomain')->unique();
            $table->string('name');
            $table->string('logo_url')->nullable();
            $table->enum('subscription_plan', ['basic', 'premium', 'enterprise'])->default('basic');
            $table->enum('subscription_status', ['active', 'trial', 'expired', 'suspended'])->default('trial');
            $table->decimal('ai_daily_budget', 10, 2)->default(0.50);
            $table->string('telegram_bot_token')->nullable();
            $table->json('settings')->default('{}');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->timestamps();
            
            $table->index('subdomain');
            $table->index('subscription_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schools');
    }
};