// app/Http/Middleware/TenantMiddleware.php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\School;
use App\Models\AuditLog;
use Symfony\Component\HttpFoundation\Response;

class TenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // Extract subdomain from host
        $host = $request->getHost();
        $subdomain = explode('.', $host)[0];
        
        // Skip for central domain
        $centralDomain = config('tenancy.central_domain', 'monadim.online');
        if ($host === $centralDomain || $subdomain === 'www') {
            return $next($request);
        }
        
        // Find school by subdomain
        $school = School::where('subdomain', $subdomain)->first();
        
        if (!$school) {
            abort(404, 'المدرسة غير موجودة');
        }
        
        // Check subscription status
        if (!$school->isSubscriptionActive()) {
            abort(403, 'اشتراك المدرسة منتهي. يرجى التواصل مع الإدارة.');
        }
        
        // Store school in request and session
        $request->attributes->set('school', $school);
        $request->attributes->set('school_id', $school->id);
        session(['school_id' => $school->id, 'school' => $school]);
        
        // Share school data with views
        view()->share('currentSchool', $school);
        
        return $next($request);
    }
}