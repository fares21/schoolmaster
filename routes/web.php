<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Web\DashboardController;
use App\Http\Controllers\Web\ProfileController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application.
| These routes are loaded by the RouteServiceProvider within a group
| which contains the "web" middleware group.
|
*/

// ==================== PUBLIC ROUTES ====================

// Landing page (for non-authenticated users)
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
})->name('welcome');

// ==================== AUTHENTICATED ROUTES ====================

Route::middleware(['auth:sanctum', 'verified'])->group(function () {
    
    // User profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    // ==================== SUPER ADMIN ROUTES ====================
    Route::prefix('super-admin')->middleware(['role:super_admin'])->name('super.')->group(function () {
        
        // Dashboard
        Route::get('/dashboard', function () {
            return Inertia::render('SuperAdmin/Dashboard');
        })->name('dashboard');
        
        // Schools Management
        Route::get('/schools', function () {
            return Inertia::render('SuperAdmin/SchoolsList');
        })->name('schools');
        
        Route::get('/schools/create', function () {
            return Inertia::render('SuperAdmin/CreateSchool');
        })->name('schools.create');
        
        Route::get('/schools/{id}', function ($id) {
            return Inertia::render('SuperAdmin/SchoolDetails', ['schoolId' => $id]);
        })->name('schools.show');
        
        // Subscriptions Management
        Route::get('/subscriptions', function () {
            return Inertia::render('SuperAdmin/Subscriptions');
        })->name('subscriptions');
        
        Route::get('/plans', function () {
            return Inertia::render('SuperAdmin/Plans');
        })->name('plans');
        
        // System Settings
        Route::get('/system-logs', function () {
            return Inertia::render('SuperAdmin/SystemLogs');
        })->name('logs');
        
        Route::get('/backups', function () {
            return Inertia::render('SuperAdmin/Backups');
        })->name('backups');
        
        Route::get('/settings', function () {
            return Inertia::render('SuperAdmin/Settings');
        })->name('settings');
        
        // Reports
        Route::get('/reports', function () {
            return Inertia::render('SuperAdmin/Reports');
        })->name('reports');
    });
    
    // ==================== SCHOOL ADMIN ROUTES ====================
    Route::prefix('school-admin')->middleware(['role:school_admin'])->name('school.')->group(function () {
        
        // Dashboard
        Route::get('/dashboard', function () {
            return Inertia::render('SchoolAdmin/Dashboard');
        })->name('dashboard');
        
        // ==================== Users Management ====================
        // Students
        Route::get('/students', function () {
            return Inertia::render('SchoolAdmin/Users/StudentsList');
        })->name('students');
        
        Route::get('/students/create', function () {
            return Inertia::render('SchoolAdmin/Users/CreateStudent');
        })->name('students.create');
        
        Route::get('/students/{id}', function ($id) {
            return Inertia::render('SchoolAdmin/Users/StudentDetails', ['studentId' => $id]);
        })->name('students.show');
        
        Route::get('/students/{id}/edit', function ($id) {
            return Inertia::render('SchoolAdmin/Users/EditStudent', ['studentId' => $id]);
        })->name('students.edit');
        
        // Teachers
        Route::get('/teachers', function () {
            return Inertia::render('SchoolAdmin/Users/TeachersList');
        })->name('teachers');
        
        Route::get('/teachers/create', function () {
            return Inertia::render('SchoolAdmin/Users/CreateTeacher');
        })->name('teachers.create');
        
        Route::get('/teachers/{id}', function ($id) {
            return Inertia::render('SchoolAdmin/Users/TeacherDetails', ['teacherId' => $id]);
        })->name('teachers.show');
        
        // Parents
        Route::get('/parents', function () {
            return Inertia::render('SchoolAdmin/Users/ParentsList');
        })->name('parents');
        
        Route::get('/parents/create', function () {
            return Inertia::render('SchoolAdmin/Users/CreateParent');
        })->name('parents.create');
        
        // ==================== Classes Management ====================
        Route::get('/classes', function () {
            return Inertia::render('SchoolAdmin/Classes/ClassesList');
        })->name('classes');
        
        Route::get('/classes/create', function () {
            return Inertia::render('SchoolAdmin/Classes/CreateClass');
        })->name('classes.create');
        
        Route::get('/classes/{id}', function ($id) {
            return Inertia::render('SchoolAdmin/Classes/ClassDetails', ['classId' => $id]);
        })->name('classes.show');
        
        Route::get('/classes/{id}/edit', function ($id) {
            return Inertia::render('SchoolAdmin/Classes/EditClass', ['classId' => $id]);
        })->name('classes.edit');
        
        // Subjects
        Route::get('/subjects', function () {
            return Inertia::render('SchoolAdmin/Subjects/SubjectsList');
        })->name('subjects');
        
        Route::get('/subjects/create', function () {
            return Inertia::render('SchoolAdmin/Subjects/CreateSubject');
        })->name('subjects.create');
        
        // ==================== Attendance ====================
        Route::get('/attendance', function () {
            return Inertia::render('SchoolAdmin/Attendance/DailyReport');
        })->name('attendance');
        
        Route::get('/attendance/class/{id}', function ($id) {
            return Inertia::render('SchoolAdmin/Attendance/ClassAttendance', ['classId' => $id]);
        })->name('attendance.class');
        
        Route::get('/attendance/reports', function () {
            return Inertia::render('SchoolAdmin/Attendance/Reports');
        })->name('attendance.reports');
        
        // ==================== Grades ====================
        Route::get('/grades', function () {
            return Inertia::render('SchoolAdmin/Grades/GradeOverview');
        })->name('grades');
        
        Route::get('/grades/class/{id}', function ($id) {
            return Inertia::render('SchoolAdmin/Grades/ClassGrades', ['classId' => $id]);
        })->name('grades.class');
        
        Route::get('/grades/analytics', function () {
            return Inertia::render('SchoolAdmin/Grades/GradeAnalytics');
        })->name('grades.analytics');
        
        // ==================== AI Features ====================
        Route::get('/ai/chat', function () {
            return Inertia::render('SchoolAdmin/AI/AIChat');
        })->name('ai.chat');
        
        Route::get('/ai/report', function () {
            return Inertia::render('SchoolAdmin/AI/UsageReport');
        })->name('ai.report');
        
        Route::get('/ai/settings', function () {
            return Inertia::render('SchoolAdmin/AI/Settings');
        })->name('ai.settings');
        
        // ==================== Announcements ====================
        Route::get('/announcements', function () {
            return Inertia::render('SchoolAdmin/Announcements/AnnouncementList');
        })->name('announcements');
        
        Route::get('/announcements/create', function () {
            return Inertia::render('SchoolAdmin/Announcements/CreateAnnouncement');
        })->name('announcements.create');
        
        Route::get('/announcements/{id}', function ($id) {
            return Inertia::render('SchoolAdmin/Announcements/AnnouncementDetails', ['announcementId' => $id]);
        })->name('announcements.show');
        
        // ==================== Financial / Fees ====================
        Route::get('/fees', function () {
            return Inertia::render('SchoolAdmin/Fees/FeesOverview');
        })->name('fees');
        
        Route::get('/fees/students', function () {
            return Inertia::render('SchoolAdmin/Fees/StudentFees');
        })->name('fees.students');
        
        Route::get('/fees/reports', function () {
            return Inertia::render('SchoolAdmin/Fees/FeeReports');
        })->name('fees.reports');
        
        Route::get('/fees/settings', function () {
            return Inertia::render('SchoolAdmin/Fees/FeeSettings');
        })->name('fees.settings');
        
        // ==================== Reports ====================
        Route::get('/reports', function () {
            return Inertia::render('SchoolAdmin/Reports/GenerateReport');
        })->name('reports');
        
        Route::get('/reports/saved', function () {
            return Inertia::render('SchoolAdmin/Reports/SavedReports');
        })->name('reports.saved');
        
        // ==================== Settings ====================
        Route::get('/settings', function () {
            return Inertia::render('SchoolAdmin/Settings/SchoolProfile');
        })->name('settings');
        
        Route::get('/settings/notifications', function () {
            return Inertia::render('SchoolAdmin/Settings/NotificationSettings');
        })->name('settings.notifications');
        
        Route::get('/settings/subscription', function () {
            return Inertia::render('SchoolAdmin/Settings/Subscription');
        })->name('settings.subscription');
        
        Route::get('/settings/telegram', function () {
            return Inertia::render('SchoolAdmin/Settings/TelegramBot');
        })->name('settings.telegram');
    });
    
    // ==================== TEACHER ROUTES ====================
    Route::prefix('teacher')->middleware(['role:teacher'])->name('teacher.')->group(function () {
        
        // Dashboard
        Route::get('/dashboard', function () {
            return Inertia::render('Teacher/Dashboard');
        })->name('dashboard');
        
        // Attendance
        Route::get('/attendance', function () {
            return Inertia::render('Teacher/Attendance/MarkAttendance');
        })->name('attendance');
        
        Route::get('/attendance/class/{id}', function ($id) {
            return Inertia::render('Teacher/Attendance/ClassAttendance', ['classId' => $id]);
        })->name('attendance.class');
        
        Route::get('/attendance/today', function () {
            return Inertia::render('Teacher/Attendance/TodayAttendance');
        })->name('attendance.today');
        
        // Gradebook
        Route::get('/grades', function () {
            return Inertia::render('Teacher/Gradebook/EnterGrades');
        })->name('grades');
        
        Route::get('/grades/class/{id}', function ($id) {
            return Inertia::render('Teacher/Gradebook/ClassGrades', ['classId' => $id]);
        })->name('grades.class');
        
        Route::get('/grades/student/{id}', function ($id) {
            return Inertia::render('Teacher/Gradebook/StudentGrades', ['studentId' => $id]);
        })->name('grades.student');
        
        Route::get('/grades/analytics', function () {
            return Inertia::render('Teacher/Gradebook/Analytics');
        })->name('grades.analytics');
        
        // Students
        Route::get('/students', function () {
            return Inertia::render('Teacher/Students/MyStudents');
        })->name('students');
        
        Route::get('/students/{id}', function ($id) {
            return Inertia::render('Teacher/Students/StudentProfile', ['studentId' => $id]);
        })->name('students.show');
        
        // Schedule
        Route::get('/schedule', function () {
            return Inertia::render('Teacher/Schedule/WeeklySchedule');
        })->name('schedule');
        
        // Announcements
        Route::get('/announcements', function () {
            return Inertia::render('Teacher/Announcements/AnnouncementList');
        })->name('announcements');
        
        Route::get('/announcements/create', function () {
            return Inertia::render('Teacher/Announcements/CreateAnnouncement');
        })->name('announcements.create');
        
        // Communication
        Route::get('/messages', function () {
            return Inertia::render('Teacher/Communication/ParentMessages');
        })->name('messages');
        
        // Profile
        Route::get('/profile', function () {
            return Inertia::render('Teacher/Profile');
        })->name('profile');
    });
    
    // ==================== STUDENT ROUTES ====================
    Route::prefix('student')->middleware(['role:student'])->name('student.')->group(function () {
        
        // Dashboard
        Route::get('/dashboard', function () {
            return Inertia::render('Student/Dashboard');
        })->name('dashboard');
        
        // Grades
        Route::get('/grades', function () {
            return Inertia::render('Student/MyGrades');
        })->name('grades');
        
        Route::get('/grades/subject/{id}', function ($id) {
            return Inertia::render('Student/SubjectGrades', ['subjectId' => $id]);
        })->name('grades.subject');
        
        // Schedule
        Route::get('/schedule', function () {
            return Inertia::render('Student/MySchedule');
        })->name('schedule');
        
        // Attendance
        Route::get('/attendance', function () {
            return Inertia::render('Student/MyAttendance');
        })->name('attendance');
        
        // Announcements
        Route::get('/announcements', function () {
            return Inertia::render('Student/Announcements');
        })->name('announcements');
        
        // Fees / Payments
        Route::get('/fees', function () {
            return Inertia::render('Student/MyFees');
        })->name('fees');
        
        Route::get('/fees/pay', function () {
            return Inertia::render('Student/PayFees');
        })->name('fees.pay');
        
        // Profile
        Route::get('/profile', function () {
            return Inertia::render('Student/Profile');
        })->name('profile');
    });
    
    // ==================== PARENT ROUTES ====================
    Route::prefix('parent')->middleware(['role:parent'])->name('parent.')->group(function () {
        
        // Dashboard
        Route::get('/dashboard', function () {
            return Inertia::render('Parent/Dashboard');
        })->name('dashboard');
        
        // Children Management
        Route::get('/children', function () {
            return Inertia::render('Parent/Children/ChildrenList');
        })->name('children');
        
        Route::get('/children/{id}', function ($id) {
            return Inertia::render('Parent/Children/ChildProfile', ['studentId' => $id]);
        })->name('children.show');
        
        // Grades (per child)
        Route::get('/grades/{studentId}', function ($studentId) {
            return Inertia::render('Parent/Grades/ChildGrades', ['studentId' => $studentId]);
        })->name('grades');
        
        // Attendance (per child)
        Route::get('/attendance/{studentId}', function ($studentId) {
            return Inertia::render('Parent/Attendance/ChildAttendance', ['studentId' => $studentId]);
        })->name('attendance');
        
        // Schedule (per child)
        Route::get('/schedule/{studentId}', function ($studentId) {
            return Inertia::render('Parent/Schedule/ChildSchedule', ['studentId' => $studentId]);
        })->name('schedule');
        
        // Announcements
        Route::get('/announcements', function () {
            return Inertia::render('Parent/Announcements');
        })->name('announcements');
        
        // Financial / Fees
        Route::get('/fees', function () {
            return Inertia::render('Parent/Fees/FeesOverview');
        })->name('fees');
        
        Route::get('/fees/pay', function () {
            return Inertia::render('Parent/Fees/PayFees');
        })->name('fees.pay');
        
        Route::get('/fees/payment-history', function () {
            return Inertia::render('Parent/Fees/PaymentHistory');
        })->name('fees.history');
        
        // Communication
        Route::get('/messages', function () {
            return Inertia::render('Parent/Messages/Conversations');
        })->name('messages');
        
        Route::get('/messages/teacher/{id}', function ($id) {
            return Inertia::render('Parent/Messages/Chat', ['teacherId' => $id]);
        })->name('messages.chat');
        
        // Profile
        Route::get('/profile', function () {
            return Inertia::render('Parent/Profile');
        })->name('profile');
        
        // Settings
        Route::get('/settings', function () {
            return Inertia::render('Parent/Settings');
        })->name('settings');
    });
    
    // ==================== COMMON ROUTES (All authenticated users) ====================
    
    // Notifications
    Route::get('/notifications', function () {
        return Inertia::render('Notifications/Index');
    })->name('notifications');
    
    // Calendar (for teachers and admins)
    Route::get('/calendar', function () {
        return Inertia::render('Calendar/Index');
    })->name('calendar');
    
    // Downloads
    Route::get('/downloads', function () {
        return Inertia::render('Downloads/Index');
    })->name('downloads');
});

// ==================== INERTIA FALLBACK ROUTE ====================
// This route handles all other Inertia requests
Route::fallback(function () {
    return Inertia::render('Error/NotFound');
})->name('fallback');
