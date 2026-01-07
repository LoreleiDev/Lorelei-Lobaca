<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Notifications\SendEmailVerificationCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Carbon\Carbon;

class EmailController extends Controller
{
    public function sendCodeToCurrentEmail(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Tidak terautentikasi.'], 401);
        }

        $request->validate(['email' => 'required|email']);

        if ($user->email !== $request->email) {
            return response()->json(['message' => 'Email tidak sesuai dengan akun Anda.'], 403);
        }

        // Hapus kode lama
        DB::table('email_change_verifications')
            ->where('user_id', $user->id)
            ->where('type', 'current')
            ->delete();

        $code = rand(100000, 999999);

        DB::table('email_change_verifications')->insert([
            'user_id' => $user->id,
            'type' => 'current',
            'email' => $user->email,
            'code' => $code,
            'expires_at' => now()->addMinutes(5),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Notification::send($user, new SendEmailVerificationCode($code, 'verifikasi email lama'));

        return response()->json(['message' => 'Kode verifikasi telah dikirim ke email Anda.']);
    }

    public function verifyCurrentEmailCode(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Tidak terautentikasi.'], 401);
        }

        $request->validate(['code' => 'required|digits:6']);

        $record = DB::table('email_change_verifications')
            ->where('user_id', $user->id)
            ->where('type', 'current')
            ->first();

        if (!$record) {
            return response()->json(['message' => 'Kode tidak ditemukan.'], 400);
        }

        // Pastikan expires_at valid
        if (Carbon::now()->greaterThan(Carbon::parse($record->expires_at))) {
            DB::table('email_change_verifications')
                ->where('user_id', $user->id)
                ->where('type', 'current')
                ->delete();
            return response()->json(['message' => 'Kode kadaluarsa.'], 400);
        }

        if ((string) $request->code !== (string) $record->code) {
            return response()->json(['message' => 'Kode verifikasi salah.'], 422);
        }

        // Hapus berdasarkan kondisi, bukan id
        DB::table('email_change_verifications')
            ->where('user_id', $user->id)
            ->where('type', 'current')
            ->delete();

        return response()->json(['message' => 'Email lama terverifikasi. Silakan masukkan email baru Anda.']);
    }

    public function sendCodeToNewEmail(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Tidak terautentikasi.'], 401);
        }

        $request->validate(['new_email' => 'required|email|unique:users,email']);

        // Hapus kode baru lama
        DB::table('email_change_verifications')
            ->where('user_id', $user->id)
            ->where('type', 'new')
            ->delete();

        $code = rand(100000, 999999);

        DB::table('email_change_verifications')->insert([
            'user_id' => $user->id,
            'type' => 'new',
            'email' => $request->new_email,
            'code' => $code,
            'expires_at' => now()->addMinutes(5),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Notification::route('mail', $request->new_email)
            ->notify(new SendEmailVerificationCode($code, 'konfirmasi email baru'));

        return response()->json(['message' => 'Kode verifikasi telah dikirim ke email baru Anda.']);
    }

    public function verifyNewEmailCode(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Tidak terautentikasi.'], 401);
        }

        $request->validate(['code' => 'required|numeric']);

        $record = DB::table('email_change_verifications')
            ->where('user_id', $user->id)
            ->where('type', 'new')
            ->first();

        if (!$record) {
            return response()->json(['message' => 'Kode tidak ditemukan.'], 400);
        }

        if (Carbon::now()->greaterThan(Carbon::parse($record->expires_at))) {
            DB::table('email_change_verifications')
                ->where('user_id', $user->id)
                ->delete(); // hapus semua tipe untuk user ini
            return response()->json(['message' => 'Kode kadaluarsa.'], 400);
        }

        if ((int) $request->code !== (int) $record->code) {
            return response()->json(['message' => 'Kode verifikasi salah.'], 422);
        }

        // Update email user
        $user->update(['email' => $record->email]);

        // Hapus semua record verifikasi email untuk user ini
        DB::table('email_change_verifications')
            ->where('user_id', $user->id)
            ->delete();

        // Hapus semua token Sanctum (wajib, karena email berubah)
        $user->tokens()->delete();

        return response()->json([
            'message' => 'Email berhasil diubah. Silakan login dengan email baru Anda.',
            'email' => $user->email
        ]);
    }
}