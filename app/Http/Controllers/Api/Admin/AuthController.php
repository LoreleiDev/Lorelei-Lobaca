<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $admin = Admin::where('email', $request->email)->first();

        if (! $admin || ! Hash::check($request->password, $admin->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        $token = $admin->createToken('admin-token', [], now()->addHours(8))->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'admin' => [
                'id' => $admin->admin_id,
                'name' => $admin->name,
                'email' => $admin->email,
            ],
        ]);
    }
    public function me(Request $request)
    {
        return response()->json([
            'admin' => $request->user('admin'),
        ]);
    }

    public function logout(Request $request)
{
    $request->user('admin')->tokens()->delete();
    
    return response()->json(['message' => 'Berhasil logout']);
}
}
