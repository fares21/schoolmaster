<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('uuid_generate_v4()'));
            $table->unsignedBigInteger('school_id')->nullable();
            $table->unsignedBigInteger('user_id');
            $table->string('user_email', 191);
            $table->string('user_ip', 45);
            $table->string('user_agent')->nullable();
            $table->string('action', 100);
            $table->string('resource_type', 100);
            $table->string('resource_id', 100);
            $table->string('resource_name')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->json('metadata')->nullable();
            $table->string('severity', 20)->default('info'); // info, warning, error, critical
            $table->timestamp('created_at')->useCurrent();
            
            // Indexes
            $table->index(['school_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index('action');
            $table->index('resource_type');
            $table->index('severity');
            $table->index('user_ip');
            $table->index('created_at');
            
            // Composite indexes for filtering
            $table->index(['resource_type', 'resource_id']);
            $table->index(['school_id', 'action', 'severity']);
            
            // Partitioning by month (executed separately)
        });
        
        // إضافة partitioning تلقائي للأشهر
        DB::statement("
            CREATE OR REPLACE FUNCTION create_audit_log_partition()
            RETURNS void AS $$
            DECLARE
                start_date date;
                end_date date;
                partition_name text;
            BEGIN
                FOR i IN 0..12 LOOP
                    start_date := date_trunc('month', CURRENT_DATE + (i || ' months')::interval)::date;
                    end_date := start_date + interval '1 month';
                    partition_name := 'audit_logs_' || to_char(start_date, 'YYYY_MM');
                    
                    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = partition_name) THEN
                        EXECUTE format('
                            CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs
                            FOR VALUES FROM (%L) TO (%L)',
                            partition_name, start_date, end_date
                        );
                    END IF;
                END LOOP;
            END;
            $$ LANGUAGE plpgsql;
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
