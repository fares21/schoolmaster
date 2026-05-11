<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\AuditLog;

class AuditMiddleware
{
    private array $auditActions = [
        'POST' => ['create', 'store', 'add'],
        'PUT' => ['update', 'edit', 'modify'],
        'PATCH' => ['update', 'partial'],
        'DELETE' => ['delete', 'destroy', 'remove'],
    ];
    
    public function handle(Request $request, Closure $next)
    {
        return $next($request);
    }
    
    public function terminate(Request $request, $response): void
    {
        // Only audit modifying requests
        if (!$this->shouldAudit($request)) {
            return;
        }
        
        // Skip audit for non-api routes
        if (!$request->is('api/*')) {
            return;
        }
        
        $user = $request->user();
        
        if (!$user) {
            return;
        }
        
        $oldData = null;
        $newData = null;
        
        // Capture old data for PUT/PATCH/DELETE
        if (in_array($request->method(), ['PUT', 'PATCH', 'DELETE'])) {
            $resourceId = $this->extractResourceId($request);
            if ($resourceId && $this->hasModelBinding($request)) {
                $model = $request->route($this->getModelParameter($request));
                if ($model && method_exists($model, 'toArray')) {
                    $oldData = $model->toArray();
                }
            }
        }
        
        // Capture new data for POST/PUT/PATCH
        if (in_array($request->method(), ['POST', 'PUT', 'PATCH'])) {
            $newData = $request->except(['password', 'password_confirmation', 'current_password']);
        }
        
        AuditLog::create([
            'school_id' => $request->get('current_school_id') ?? $user->school_id,
            'user_id' => $user->id,
            'user_email' => $user->email,
            'user_ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'action' => $this->determineAction($request),
            'resource_type' => $this->getResourceType($request),
            'resource_id' => $this->extractResourceId($request) ?? '',
            'old_values' => $oldData,
            'new_values' => $newData,
            'severity' => $this->determineSeverity($request),
            'metadata' => [
                'method' => $request->method(),
                'path' => $request->path(),
                'status_code' => $response->status(),
                'duration_ms' => defined('LARAVEL_START') ? round((microtime(true) - LARAVEL_START) * 1000) : null,
            ],
        ]);
    }
    
    private function shouldAudit(Request $request): bool
    {
        $method = $request->method();
        
        // Audit POST, PUT, PATCH, DELETE methods
        return in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE']);
    }
    
    private function determineAction(Request $request): string
    {
        $path = $request->path();
        $method = $request->method();
        
        // Try to extract action from path segments
        $segments = explode('/', $path);
        $lastSegment = end($segments);
        
        // Check if last segment is a typical action
        $actionMap = [
            'store' => 'create',
            'update' => 'update',
            'destroy' => 'delete',
            'show' => 'view',
            'index' => 'list',
        ];
        
        if (isset($actionMap[$lastSegment])) {
            return $actionMap[$lastSegment];
        }
        
        // Default based on HTTP method
        return $this->auditActions[$method][0] ?? $method;
    }
    
    private function getResourceType(Request $request): string
    {
        $path = $request->path();
        $segments = explode('/', $path);
        
        // Remove api/v1 prefix
        if (isset($segments[0]) && $segments[0] === 'api') {
            array_shift($segments);
        }
        if (isset($segments[0]) && preg_match('/^v\d+$/', $segments[0])) {
            array_shift($segments);
        }
        
        $resource = $segments[0] ?? 'unknown';
        
        // Singularize resource name
        return rtrim($resource, 's');
    }
    
    private function extractResourceId(Request $request): ?string
    {
        $path = $request->path();
        
        // Match numeric IDs in path
        if (preg_match('/(\d+)(?:\/|$)/', $path, $matches)) {
            return $matches[1];
        }
        
        // Try to get from route parameter
        $route = $request->route();
        if ($route) {
            $parameters = $route->parameters();
            foreach ($parameters as $name => $value) {
                if (is_numeric($value) || (is_string($value) && strlen($value) === 36)) {
                    return (string) $value;
                }
            }
        }
        
        return null;
    }
    
    private function hasModelBinding(Request $request): bool
    {
        $route = $request->route();
        if (!$route) {
            return false;
        }
        
        $parameters = $route->parameters();
        foreach ($parameters as $param) {
            if (is_object($param) && method_exists($param, 'getKey')) {
                return true;
            }
        }
        
        return false;
    }
    
    private function getModelParameter(Request $request): string
    {
        $route = $request->route();
        if (!$route) {
            return '';
        }
        
        $parameters = $route->parameterNames();
        foreach ($parameters as $name) {
            $value = $route->parameter($name);
            if (is_object($value) && method_exists($value, 'getKey')) {
                return $name;
            }
        }
        
        return '';
    }
    
    private function determineSeverity(Request $request): string
    {
        $method = $request->method();
        
        return match ($method) {
            'DELETE' => 'critical',
            'PUT', 'PATCH' => 'warning',
            'POST' => 'info',
            default => 'info',
        };
    }
}
