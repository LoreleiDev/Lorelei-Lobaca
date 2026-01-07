<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'id' => $user->id,
            'name' => $user->fullname,
            'phone' => $user->phone,
            'email' => $user->email,
            'avatar' => $user->avatar,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
            'avatar' => ['nullable', 'url', 'max:500'],
            'old_avatar_url' => ['nullable', 'url', 'max:500']
        ]);

        $oldAvatar = $user->avatar;

        $user->update([
            'first_name' => $request->first_name ?? $user->first_name,
            'last_name' => $request->last_name ?? $user->last_name,
            'phone' => $request->phone ?? $user->phone,
            'avatar' => $request->avatar ?? $user->avatar,
        ]);

        if ($request->avatar && $oldAvatar && $request->avatar !== $oldAvatar) {
            $this->deleteOldAvatarFromCloudinary($oldAvatar);
        }

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->fullname,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'phone' => $user->phone,
                'email' => $user->email,
                'avatar' => $user->avatar,
            ]
        ]);
    }

    /**
     * Hapus avatar lama dari Cloudinary
     */
    private function deleteOldAvatarFromCloudinary($avatarUrl)
    {
        try {
            $path = parse_url($avatarUrl, PHP_URL_PATH);
            $parts = explode('/', $path);

            $uploadIndex = array_search('upload', $parts);
            if ($uploadIndex !== false && isset($parts[$uploadIndex + 1])) {

                $publicId = implode('/', array_slice($parts, $uploadIndex + 2));

                $publicId = preg_replace('/\.[^.]*$/', '', $publicId);

                $cloudName = env('CLOUDINARY_CLOUD_NAME');
                $apiKey = env('CLOUDINARY_API_KEY');
                $apiSecret = env('CLOUDINARY_API_SECRET');
                $timestamp = time();

                $signature = sha1("public_id={$publicId}&timestamp={$timestamp}{$apiSecret}");

                $response = Http::asForm()->post("https://api.cloudinary.com/v1_1/{$cloudName}/image/destroy", [
                    'public_id' => $publicId,
                    'signature' => $signature,
                    'api_key' => $apiKey,
                    'timestamp' => $timestamp,
                ]);

                Log::info('Deleted old avatar from Cloudinary', [
                    'public_id' => $publicId,
                    'success' => $response->successful()
                ]);

                return $response->successful();
            }
        } catch (\Exception $e) {
            Log::error('Failed to delete old avatar from Cloudinary: ' . $e->getMessage());
        }

        return false;
    }

    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar_url' => 'required|url|max:500'
        ]);

        $user = $request->user();
        $oldAvatar = $user->avatar;

        $user->update(['avatar' => $request->avatar_url]);

        // Hapus avatar lama jika ada
        if ($oldAvatar && $oldAvatar !== $request->avatar_url) {
            $this->deleteOldAvatarFromCloudinary($oldAvatar);
        }

        return response()->json([
            'message' => 'Avatar updated',
            'avatar' => $user->avatar
        ]);
    }
}
