// routes/web.php (Inertia Routes)
<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Super Admin Routes
Route::prefix('super-admin')->middleware(['auth:sanctum', 'role:super_admin'])->group(function () {
    Route::get('/', fn() => Inertia::render('SuperAdmin/Dashboard'))->name('super.dashboard');
    Route::get('/schools', fn() => Inertia::render('SuperAdmin/SchoolsList'))->name('super.schools');
    Route::get('/subscriptions', fn() => Inertia::render('SuperAdmin/Subscriptions'))->name('super.subscriptions');
});

// School Admin Routes
Route::prefix('school-admin')->middleware(['auth:sanctum', 'role:school_admin'])->group(function () {
    Route::get('/', fn() => Inertia::render('SchoolAdmin/Dashboard'))->name('school.dashboard');
    Route::get('/students', fn() => Inertia::render('SchoolAdmin/Users/StudentsList'))->name('school.students');
    Route::get('/attendance', fn() => Inertia::render('SchoolAdmin/Attendance/DailyReport'))->name('school.attendance');
    Route::get('/ai/chat', fn() => Inertia::render('SchoolAdmin/AI/AIChat'))->name('school.ai.chat');
    Route::get('/ai/report', fn() => Inertia::render('SchoolAdmin/AI/UsageReport'))->name('school.ai.report');
    Route::get('/announcements', fn() => Inertia::render('SchoolAdmin/Announcements/AnnouncementList'))->name('school.announcements');
    Route::get('/settings', fn() => Inertia::render('SchoolAdmin/Settings/SchoolProfile'))->name('school.settings');
});

// Teacher Routes
Route::prefix('teacher')->middleware(['auth:sanctum', 'role:teacher'])->group(function () {
    Route::get('/', fn() => Inertia::render('Teacher/Dashboard'))->name('teacher.dashboard');
    Route::get('/attendance', fn() => Inertia::render('Teacher/Attendance/MarkAttendance'))->name('teacher.attendance');
    Route::get('/grades', fn() => Inertia::render('Teacher/Gradebook/EnterGrades'))->name('teacher.grades');
});

// Student Routes
Route::prefix('student')->middleware(['auth:sanctum', 'role:student'])->group(function () {
    Route::get('/', fn() => Inertia::render('Student/Dashboard'))->name('student.dashboard');
    Route::get('/grades', fn() => Inertia::render('Student/MyGrades'))->name('student.grades');
    Route::get('/schedule', fn() => Inertia::render('Student/MySchedule'))->name('student.schedule');
});

// Parent Routes
Route::prefix('parent')->middleware(['auth:sanctum', 'role:parent'])->group(function () {
    Route::get('/', fn() => Inertia::render('Parent/Dashboard'))->name('parent.dashboard');
    Route::get('/children', fn() => Inertia::render('Parent/Children'))->name('parent.children');
});

// Telegram Webhook (Public)
Route::post('telegram/webhook/{schoolId}', [App\Http\Controllers\TelegramWebhookController::class, 'handle']);