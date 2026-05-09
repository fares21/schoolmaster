// routes/api.php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AIController;
use App\Http\Controllers\Api\AnnouncementController;

// Public routes
Route::post('login', [AuthController::class, 'login']);

// Telegram Webhook (Public - no auth)
Route::post('telegram/webhook/{schoolId}', [App\Http\Controllers\TelegramWebhookController::class, 'handle']);

// Protected routes
Route::middleware(['auth:sanctum', 'track.ai'])->group(function () {
    
    // Auth
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);
    Route::post('change-password', [AuthController::class, 'changePassword']);
    
    // Attendance
    Route::prefix('attendance')->group(function () {
        Route::post('mark', [AttendanceController::class, 'markAttendance']);
        Route::get('class/{classId}', [AttendanceController::class, 'getClassAttendance']);
        Route::get('today-summary', [AttendanceController::class, 'getTodaySummary']);
        Route::get('export/{classId}', [AttendanceController::class, 'exportReport']);
    });
    
    // AI (Strict: Only School Admin)
    Route::prefix('ai')->middleware(['role:school_admin'])->group(function () {
        Route::post('chat', [AIController::class, 'chat']);
        Route::get('stats', [AIController::class, 'getStats']);
        Route::get('usage-report', [AIController::class, 'getUsageReport']);
    });
    
    // Announcements
    Route::apiResource('announcements', AnnouncementController::class);
    Route::patch('announcements/{id}/mark-viewed', [AnnouncementController::class, 'markViewed']);
});
