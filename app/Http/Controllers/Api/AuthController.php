// app/Http/Controllers/Api/AuthController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\School;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    // Login endpoint
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password_hash)) {
            AuditLog::log(
                $request->attributes->get('school_id'),
                null,
                'login_failed',
                ['email' => $request->email, 'ip' => $request->ip()]
            );
            return response()->json(['message' => 'بيانات الدخول غير صحيحة'], 401);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'الحساب غير نشط. يرجى التواصل مع الإدارة'], 403);
        }

        // Check school subscription if user is not super_admin
        if (!$user->isSuperAdmin()) {
            $school = School::find($user->school_id);
            if (!$school || !$school->isSubscriptionActive()) {
                return response()->json(['message' => 'اشتراك المدرسة منتهي'], 403);
            }
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        AuditLog::log(
            $user->school_id,
            $user->id,
            'login_success',
            ['ip' => $request->ip()]
        );

        $user->update(['last_login_at' => now()]);

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->full_name,
                'email' => $user->email,
                'role' => $user->role,
                'school_id' => $user->school_id,
            ]
        ]);
    }

    // Logout endpoint
    public function logout(Request $request)
    {
        $user = $request->user();
        
        if ($user) {
            AuditLog::log(
                $user->school_id,
                $user->id,
                'logout',
                ['ip' => $request->ip()]
            );
            $user->currentAccessToken()->delete();
        }

        return response()->json(['success' => true, 'message' => 'تم تسجيل الخروج بنجاح']);
    }

    // Get current user
    public function me(Request $request)
    {
        $user = $request->user();
        
        return response()->json([
            'id' => $user->id,
            'name' => $user->full_name,
            'email' => $user->email,
            'role' => $user->role,
            'school_id' => $user->school_id,
            'is_active' => $user->is_active,
            'last_login_at' => $user->last_login_at,
        ]);
    }

    // Change password
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password_hash)) {
            return response()->json(['message' => 'كلمة المرور الحالية غير صحيحة'], 401);
        }

        $user->update([
            'password_hash' => Hash::make($request->new_password)
        ]);

        AuditLog::log(
            $user->school_id,
            $user->id,
            'password_changed',
            ['ip' => $request->ip()]
        );

        return response()->json(['success' => true, 'message' => 'تم تغيير كلمة المرور بنجاح']);
    }
}