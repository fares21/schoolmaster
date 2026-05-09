// app/Http/Middleware/TrackAIBudgetMiddleware.php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\AIUsage;
use Symfony\Component\HttpFoundation\Response;

class TrackAIBudgetMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $school = $request->attributes->get('school');
        
        // Only check for AI-related routes
        if (!$request->routeIs('ai.*') && !$request->is('*/ai/*')) {
            return $next($request);
        }
        
        // Strict policy: Only school_admin can access AI
        if (!$user || !$user->canAccessAI()) {
            abort(403, 'غير مصرح لك باستخدام الذكاء الاصطناعي. هذه الميزة متاحة فقط لمدير المدرسة.');
        }
        
        // Check AI budget
        if ($school && !$school->hasAIBudgetRemaining()) {
            abort(429, 'تم استنفاذ ميزانية الذكاء الاصطناعي اليومية. الرجاء المحاولة غداً.');
        }
        
        // Check rate limit (10 requests per hour)
        $requestsThisHour = AIUsage::where('user_id', $user->id)
            ->where('created_at', '>=', now()->subHour())
            ->count();
        
        if ($requestsThisHour >= 10) {
            abort(429, 'لقد تجاوزت الحد الأقصى للطلبات (10 طلبات في الساعة). الرجاء المحاولة لاحقاً.');
        }
        
        return $next($request);
    }
}