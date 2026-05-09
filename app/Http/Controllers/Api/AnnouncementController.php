// app/Http/Controllers/Api/AnnouncementController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\AnnouncementView;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AnnouncementController extends Controller
{
    // Get all announcements
    public function index(Request $request)
    {
        $schoolId = $request->attributes->get('school_id');
        $user = $request->user();
        
        $query = Announcement::where('school_id', $schoolId)
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
        
        // Filter based on user role
        if ($user->isTeacher()) {
            $query->where(function ($q) {
                $q->where('type', 'school')
                    ->orWhere('type', 'class');
            });
        } elseif ($user->isStudent()) {
            $student = $user->student;
            $query->where(function ($q) use ($student) {
                $q->where('type', 'school')
                    ->orWhere(function ($sub) use ($student) {
                        $sub->where('type', 'class')
                            ->whereJsonContains('target_ids', $student->class_id);
                    });
            });
        } elseif ($user->isParent()) {
            $studentIds = $user->parentStudents()->pluck('student_id');
            $query->where(function ($q) use ($studentIds) {
                $q->where('type', 'school')
                    ->orWhere('type', 'parent')
                    ->orWhere(function ($sub) use ($studentIds) {
                        $sub->where('type', 'class')
                            ->whereJsonContains('target_ids', $studentIds);
                    });
            });
        }
        
        $announcements = $query->orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Mark viewed
        foreach ($announcements as $announcement) {
            $viewed = AnnouncementView::where('announcement_id', $announcement->id)
                ->where('user_id', $user->id)
                ->exists();
            
            $announcement->viewed = $viewed;
        }
        
        return response()->json(['success' => true, 'data' => $announcements]);
    }

    // Create announcement (SchoolAdmin only)
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'type' => 'required|in:school,class,parent,system',
            'priority' => 'required|in:low,medium,high,urgent',
            'target_type' => 'required|in:all,role,class,specific_users',
            'target_ids' => 'nullable|array',
            'send_web' => 'boolean',
            'send_telegram' => 'boolean',
            'send_email' => 'boolean',
            'expires_at' => 'nullable|date|after:now',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        
        // Only school_admin and super_admin can create announcements
        if (!$user->canManageUsers()) {
            return response()->json(['message' => 'غير مصرح لك بإنشاء إعلانات'], 403);
        }

        $announcement = Announcement::create([
            'school_id' => $request->attributes->get('school_id'),
            'created_by' => $user->id,
            'title' => $request->title,
            'content' => $request->content,
            'type' => $request->type,
            'priority' => $request->priority,
            'target_type' => $request->target_type,
            'target_ids' => $request->target_ids,
            'send_web' => $request->send_web ?? true,
            'send_telegram' => $request->send_telegram ?? false,
            'send_email' => $request->send_email ?? false,
            'expires_at' => $request->expires_at,
            'is_active' => true,
        ]);

        AuditLog::log(
            $request->attributes->get('school_id'),
            $user->id,
            'announcement_created',
            ['announcement_id' => $announcement->id, 'title' => $announcement->title]
        );

        // Dispatch notifications to channels
        $this->dispatchAnnouncement($announcement);

        return response()->json([
            'success' => true,
            'message' => 'تم نشر الإعلان بنجاح',
            'data' => $announcement
        ], 201);
    }

    // Mark announcement as viewed
    public function markViewed(Request $request, $id)
    {
        $user = $request->user();
        
        AnnouncementView::firstOrCreate([
            'announcement_id' => $id,
            'user_id' => $user->id,
        ]);
        
        return response()->json(['success' => true]);
    }

    private function dispatchAnnouncement($announcement)
    {
        // This will send notifications via different channels
        // Implementation will use NotificationService
    }
}