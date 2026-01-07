<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Notifications\ResetPasswordNotification;
use App\Notifications\PasswordChangedNotification;

class PasswordController extends Controller
{
    // Kirim kode verifikasi 6 digit ke email
    public function sendResetCode(Request $request)
    {
        $request->validate(['email' => 'required|email|exists:users,email']);

        $email = $request->email;

        // Batas 3x/hari
        $attemptsToday = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->where('created_at', '>=', now()->startOfDay())
            ->count();

        if ($attemptsToday >= 3) {
            return response()->json([
                'message' => 'Batas maksimal 3 permintaan/hari. Coba lagi besok.'
            ], 429);
        }

        // Buat kode 6 digit
        $code = rand(100000, 999999);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            [
                'token' => $code,
                'created_at' => now()
            ]
        );

        // Kirim notifikasi
        $user = User::where('email', $email)->first();
        $user->notify(new ResetPasswordNotification($code));

        return response()->json(['message' => 'Kode verifikasi dikirim ke email Anda.']);
    }

    // Verifikasi kode
    public function verifyResetCode(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'code' => 'required|numeric'
        ]);

        $valid = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', $request->code)
            ->where('created_at', '>=', now()->subMinutes(5))
            ->exists();

        if (!$valid) {
            return response()->json(['message' => 'Kode tidak valid atau kadaluarsa.'], 400);
        }

        return response()->json(['message' => 'Kode valid. Silakan masukkan password baru.']);
    }

    // Reset password dengan kode
    public function resetPasswordViaCode(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'code' => 'required|numeric',
            'password' => 'required|min:8|confirmed'
        ]);

        // Verifikasi kode
        $valid = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', $request->code)
            ->where('created_at', '>=', now()->subMinutes(5))
            ->first();

        if (!$valid) {
            return response()->json(['message' => 'Kode tidak valid atau kadaluarsa.'], 400);
        }

        $user = User::where('email', $request->email)->first();

        // Cek apakah password baru sama dengan password lama
        if (Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Password baru tidak boleh sama dengan password lama.'
            ], 422);
        }

        // Update password DAN reset counter gagal login
        $user = User::where('email', $request->email)->first();
        $user->update([
            'password' => Hash::make($request->password),
            'failed_login_attempts' => 0
        ]);
        $user->notify(new PasswordChangedNotification());

        // Hapus token
        DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->delete();

        return response()->json(['message' => 'Password berhasil diubah.']);
    }
}
