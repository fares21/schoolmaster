<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use App\Models\School;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class TenantMiddleware
{
    private const TENANT_HEADER = 'X-School-ID';
    private const TENANT_SESSION_KEY = 'tenant_id';
    
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        
        // Super admin bypass for platform management
        if ($user && $user->isSuperAdmin()) {
            // Allow super admin to specify school context
            $schoolId = $request->header(self::TENANT_HEADER);
            
            if ($schoolId) {
                $school = School::find($schoolId);
                if (!$school || !$school->is_active) {
                    return $this->errorResponse(
                        'Invalid or inactive school context',
                        JsonResponse::HTTP_FORBIDDEN
                    );
                }
                session([self::TENANT_SESSION_KEY => $schoolId]);
            }
            
            return $next($request);
        }
        
        // Regular user MUST have a school context
        $schoolId = $request->header(self::TENANT_HEADER);
        
        if (!$schoolId) {
            return $this->errorResponse(
                'School ID header (X-School-ID) is required',
                JsonResponse::HTTP_BAD_REQUEST
            );
        }
        
        // Validate school exists and is active
        $school = School::where('id', $schoolId)
            ->where('status', 'active')
            ->first();
            
        if (!$school) {
            $this->logSecurityAttempt($request, $schoolId, 'invalid_school');
            return $this->errorResponse(
                'Invalid or inactive school',
                JsonResponse::HTTP_FORBIDDEN
            );
        }
        
        // Check subscription status
        if (!$school->is_subscription_valid) {
            $this->logSecurityAttempt($request, $schoolId, 'expired_subscription');
            return $this->errorResponse(
                'School subscription is expired or inactive',
                JsonResponse::HTTP_PAYMENT_REQUIRED
            );
        }
        
        // Verify user belongs to this school
        if ($user && !$this->userBelongsToSchool($user, $schoolId)) {
            $this->logSecurityAttempt($request, $schoolId, 'tenant_mismatch', ['user_id' => $user->id]);
            return $this->errorResponse(
                'Access denied: User does not belong to this school',
                JsonResponse::HTTP_FORBIDDEN
            );
        }
        
        // Set tenant context
        $this->setTenantContext($schoolId);
        
        // Store in request for easy access
        $request->merge([
            'current_school' => $school,
            'current_school_id' => $schoolId,
        ]);
        
        // Set database session variable for RLS
        $this->setDatabaseTenantContext($schoolId);
        
        $response = $next($request);
        
        // Clean up tenant context
        $this->clearTenantContext();
        
        return $response;
    }
    
    private function userBelongsToSchool($user, int $schoolId): bool
    {
        if (!$user) {
            return false;
        }
        
        // Check direct school relationship
        if ($user->school_id === $schoolId) {
            return true;
        }
        
        // Check via student relationship
        if ($user->student && $user->student->school_id === $schoolId) {
            return true;
        }
        
        // Check via teacher relationship
        if ($user->teacher && $user->teacher->school_id === $schoolId) {
            return true;
        }
        
        // Check via parent relationship (parents can have multiple children in different schools?)
        if ($user->parent && $user->parent->school_id === $schoolId) {
            return true;
        }
        
        return false;
    }
    
    private function setTenantContext(int $schoolId): void
    {
        session([self::TENANT_SESSION_KEY => $schoolId]);
        
        // Also set in config for global access
        config(['tenant.current_id' => $schoolId]);
    }
    
    private function setDatabaseTenantContext(int $schoolId): void
    {
        try {
            // Set PostgreSQL session variable for RLS policies
            DB::statement("SELECT set_config('app.current_school_id', ?, false)", [$schoolId]);
        } catch (\Exception $e) {
            Log::error('Failed to set database tenant context', [
                'school_id' => $schoolId,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    private function clearTenantContext(): void
    {
        session()->forget(self::TENANT_SESSION_KEY);
        config(['tenant.current_id' => null]);
        
        try {
            DB::statement("SELECT set_config('app.current_school_id', '', false)");
        } catch (\Exception $e) {
            // Ignore cleanup errors
        }
    }
    
    private function logSecurityAttempt(Request $request, ?int $schoolId, string $reason, array $extra = []): void
    {
        if (config('app.log_security_attempts', true)) {
            Log::warning('Tenant isolation security attempt', array_merge([
                'ip' => $request->ip(),
                'path' => $request->path(),
                'method' => $request->method(),
                'user_id' => $request->user()?->id,
                'school_id' => $schoolId,
                'reason' => $reason,
                'user_agent' => $request->userAgent(),
            ], $extra));
        }
        
        // Optionally store in audit logs
        if ($request->user()) {
            AuditLog::create([
                'school_id' => $schoolId,
                'user_id' => $request->user()->id,
                'user_email' => $request->user()->email,
                'user_ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'action' => 'tenant_violation_attempt',
                'resource_type' => 'security',
                'resource_id' => 'tenant_isolation',
                'severity' => 'critical',
                'metadata' => ['reason' => $reason],
            ]);
        }
    }
    
    private function errorResponse(string $message, int $statusCode): JsonResponse
    {
        return response()->json([
            'success' => false,
            'error' => $message,
            'code' => $statusCode,
            'timestamp' => now()->toIso8601String(),
        ], $statusCode);
    }
}
