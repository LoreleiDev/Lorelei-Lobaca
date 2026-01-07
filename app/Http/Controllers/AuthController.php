<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function showRegisterForm()
    {
        return view('auth.register');
    }
    public function register(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);
        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'phone' => $request->phone,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);
        Auth::login($user);
        return redirect()->route('profile')->with('success', 'Akun berhasil dibuat!');
    }

    public function showLoginForm()
    {
        return view('auth.login');
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);
        $user = User::where('email', $request->email)->first();
        if ($user && $user->failed_login_attempts >= 3) {
            return back()->withErrors([
                'email' => 'Akun Anda terkunci karena terlalu banyak percobaan gagal. Silakan reset password Anda.',
            ]);
        }
        if ($user && Hash::check($request->password, $user->password)) {
            $user->update(['failed_login_attempts' => 0]);
            Auth::login($user, $request->filled('remember'));
            $request->session()->regenerate();
            return redirect()->intended('/profile');
        }
        if ($user) {
            $user->increment('failed_login_attempts');
        }
        return back()->withErrors([
            'email' => 'Email atau password salah.',
        ])->withInput(['email']);
    }

    public function apiRegister(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8|confirmed',
        ]);
        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'phone' => $request->phone,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'failed_login_attempts' => 0,
        ]);
        $token = $user->createToken('auth-token')->plainTextToken;
        return response()->json([
            'message' => 'Registrasi berhasil',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user->only('id', 'first_name', 'last_name', 'email', 'phone')
        ], 201);
    }

    public function apiLogin(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);
        $user = User::where('email', $request->email)->first();
        if ($user && $user->failed_login_attempts >= 3) {
            return response()->json([
                'message' => 'Akun Anda terkunci karena terlalu banyak percobaan gagal. Silakan reset password Anda.'
            ], 423);
        }
        if ($user && Hash::check($request->password, $user->password)) {
            $user->update(['failed_login_attempts' => 0]);
            $token = $user->createToken('auth-token')->plainTextToken;
            return response()->json([
                'message' => 'Login berhasil',
                'access_token' => $token,
                'token_type' => 'Bearer',
                'user' => $user->only('id', 'first_name', 'last_name', 'email')
            ]);
        }
        if ($user) {
            $user->increment('failed_login_attempts');
        }
        return response()->json([
            'message' => 'Email atau password salah.'
        ], 401);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user && $token = $user->currentAccessToken()) {
            $token->delete();
        }
        return response()->json(['message' => 'Logout berhasil']);
    }
}
