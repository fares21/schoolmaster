<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string $role)
    {
        $user = $request->user();
        
        if (!$user) {
            return $this->errorResponse('Unauthenticated', JsonResponse::HTTP_UNAUTHORIZED);
        }
        
        // Check if user has the required role
        if (!$user->hasRole($role)) {
            // Check for multiple roles (comma separated)
            $roles = explode('|', $role);
            $hasAnyRole = false;
            
            foreach ($roles as $r) {
                if ($user->hasRole(trim($r))) {
                    $hasAnyRole = true;
                    break;
                }
            }
            
            if (!$hasAnyRole) {
                $this->logAccessViolation($request, $role);
                return $this->errorResponse(
                    'Access denied: Insufficient permissions',
                    JsonResponse::HTTP_FORBIDDEN
                );
            }
        }
        
        return $next($request);
    }
    
    private function logAccessViolation(Request $request, string $requiredRole): void
    {
        if (config('app.log_access_violations', true)) {
            \Illuminate\Support\Facades\Log::warning('Role access violation', [
                'ip' => $request->ip(),
                'path' => $request->path(),
                'user_id' => $request->user()?->id,
                'user_email' => $request->user()?->email,
                'required_role' => $requiredRole,
                'user_roles' => $request->user()?->roles->pluck('name'),
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
