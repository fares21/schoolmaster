// app/Http/Middleware/RoleMiddleware.php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return redirect()->route('login');
        }
        
        // Check if user has any of the allowed roles
        if (!empty($roles) && !in_array($user->role, $roles)) {
            abort(403, 'غير مصرح لك بالوصول إلى هذه الصفحة');
        }
        
        // Check if user is active
        if (!$user->is_active) {
            abort(403, 'الحساب غير نشط. يرجى التواصل مع الإدارة.');
        }
        
        // Update last login time
        $user->update(['last_login_at' => now()]);
        
        return $next($request);
    }
}