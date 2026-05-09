// app/Http/Controllers/Api/AttendanceController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Student;
use App\Models\ClassModel;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class AttendanceController extends Controller
{
    // Mark attendance for students
    public function markAttendance(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
            'status' => 'required|in:present,absent,late,excused',
            'date' => 'required|date',
            'class_id' => 'required|exists:classes,id',
            'message' => 'nullable|string',
            'notify_parent' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        $schoolId = $request->attributes->get('school_id');

        $attendanceRecords = [];
        
        DB::beginTransaction();
        
        try {
            foreach ($request->student_ids as $studentId) {
                $attendance = Attendance::updateOrCreate(
                    [
                        'student_id' => $studentId,
                        'class_id' => $request->class_id,
                        'date' => $request->date,
                    ],
                    [
                        'school_id' => $schoolId,
                        'status' => $request->status,
                        'recorded_by' => $user->id,
                        'message' => $request->message,
                    ]
                );
                $attendanceRecords[] = $attendance;
                
                // If absent and notify parent is true, send notification
                if ($request->status === 'absent' && $request->notify_parent) {
                    $this->sendAbsentNotification($studentId, $request->message);
                }
            }
            
            DB::commit();
            
            AuditLog::log(
                $schoolId,
                $user->id,
                'attendance_marked',
                [
                    'student_count' => count($request->student_ids),
                    'status' => $request->status,
                    'date' => $request->date,
                    'class_id' => $request->class_id,
                ]
            );
            
            return response()->json([
                'success' => true,
                'message' => 'تم تسجيل الحضور بنجاح',
                'data' => $attendanceRecords
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'حدث خطأ أثناء تسجيل الحضور'], 500);
        }
    }

    // Get attendance report for a class
    public function getClassAttendance(Request $request, $classId)
    {
        $validator = Validator::make($request->all(), [
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $schoolId = $request->attributes->get('school_id');
        
        $class = ClassModel::where('id', $classId)
            ->where('school_id', $schoolId)
            ->firstOrFail();
        
        $attendances = Attendance::where('class_id', $classId)
            ->whereBetween('date', [$request->start_date, $request->end_date])
            ->with('student')
            ->get()
            ->groupBy('student_id');
        
        $students = Student::where('class_id', $classId)
            ->where('school_id', $schoolId)
            ->get();
        
        $report = [];
        foreach ($students as $student) {
            $studentAttendance = $attendances->get($student->id, collect());
            $report[] = [
                'student_id' => $student->id,
                'student_name' => $student->full_name,
                'student_code' => $student->student_code,
                'present' => $studentAttendance->where('status', 'present')->count(),
                'absent' => $studentAttendance->where('status', 'absent')->count(),
                'late' => $studentAttendance->where('status', 'late')->count(),
                'excused' => $studentAttendance->where('status', 'excused')->count(),
                'total_days' => $studentAttendance->count(),
                'attendance_rate' => $studentAttendance->count() > 0 
                    ? round(($studentAttendance->where('status', 'present')->count() / $studentAttendance->count()) * 100, 2)
                    : 0,
            ];
        }
        
        return response()->json([
            'success' => true,
            'class' => $class,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'data' => $report
        ]);
    }

    // Get today's attendance summary
    public function getTodaySummary(Request $request)
    {
        $schoolId = $request->attributes->get('school_id');
        $user = $request->user();
        
        $query = Attendance::whereDate('date', today())
            ->where('school_id', $schoolId);
        
        if ($user->isTeacher()) {
            $teacherClasses = ClassModel::where('teacher_id', $user->teacher->id)->pluck('id');
            $query->whereIn('class_id', $teacherClasses);
        }
        
        $summary = [
            'total' => $query->count(),
            'present' => $query->where('status', 'present')->count(),
            'absent' => $query->where('status', 'absent')->count(),
            'late' => $query->where('status', 'late')->count(),
            'excused' => $query->where('status', 'excused')->count(),
        ];
        
        $summary['attendance_rate'] = $summary['total'] > 0 
            ? round(($summary['present'] / $summary['total']) * 100, 2)
            : 0;
        
        return response()->json(['success' => true, 'data' => $summary]);
    }

    // Export attendance report
    public function exportReport(Request $request, $classId)
    {
        // This will generate Excel/PDF export
        // Implementation depends on the export library used
        return response()->json(['message' => 'Export functionality coming soon']);
    }

    private function sendAbsentNotification($studentId, $message)
    {
        // This will send notification to parent via Telegram/Email
        // Implementation will use NotificationService
    }
}