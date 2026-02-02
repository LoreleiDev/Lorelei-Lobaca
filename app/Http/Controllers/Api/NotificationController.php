<?php
namespace App\Http\Controllers\Api;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::guard('sanctum')->user();

        Log::info('🔍 [Notifications] Index called', [
            'user' => $user ? $user->id : 'null',
            'email' => $user ? $user->email : 'null'
        ]);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terotentikasi'
            ], 401);
        }

        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $unreadCount = $notifications->where('is_read', false)->count();

        Log::info('📊 [Notifications] Found', [
            'user_id' => $user->id,
            'count' => $notifications->count(),
            'unread' => $unreadCount
        ]);

        return response()->json([
            'success' => true,
            'data' => $notifications,
            'unread_count' => $unreadCount,
            'total' => $notifications->count()
        ]);
    }

    public function markAsRead($id)
    {
        $user = Auth::guard('sanctum')->user(); 

        Log::info('📝 [Notifications] Mark as read called', [
            'notification_id' => $id,
            'user' => $user ? $user->id : 'null'
        ]);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terotentikasi'
            ], 401);
        }

        
        $notification = Notification::where('notification_id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$notification) {
            Log::warning('⚠️ [Notifications] Not found', [
                'notification_id' => $id,
                'user_id' => $user->id
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Notifikasi tidak ditemukan'
            ], 404);
        }

        $notification->update([
            'is_read' => true,
            'read_at' => now()
        ]);

        Log::info('✅ [Notifications] Marked as read', [
            'notification_id' => $notification->notification_id,
            'user_id' => $user->id
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi ditandai sebagai dibaca',
            'data' => $notification
        ]);
    }

    public function markAllAsRead()
    {
        $user = Auth::guard('sanctum')->user(); 

        Log::info('📝 [Notifications] Mark all as read called', [
            'user' => $user ? $user->id : 'null'
        ]);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terotentikasi'
            ], 401);
        }

        
        $updated = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now()
            ]);

        Log::info('✅ [Notifications] Marked all as read', [
            'user_id' => $user->id,
            'count' => $updated
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Semua notifikasi ditandai sebagai dibaca',
            'updated' => $updated
        ]);
    }

    public function destroy($id)
    {
        $user = Auth::guard('sanctum')->user(); 

        Log::info('🗑️ [Notifications] Destroy called', [
            'notification_id' => $id,
            'user' => $user ? $user->id : 'null'
        ]);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terotentikasi'
            ], 401);
        }

        
        $notification = Notification::where('notification_id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$notification) {
            Log::warning('⚠️ [Notifications] Not found for delete', [
                'notification_id' => $id,
                'user_id' => $user->id
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Notifikasi tidak ditemukan'
            ], 404);
        }

        $notification->delete();

        Log::info('✅ [Notifications] Deleted', [
            'notification_id' => $notification->notification_id,
            'user_id' => $user->id
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi berhasil dihapus'
        ]);
    }

    public function destroyAllRead()
    {
        $user = Auth::guard('sanctum')->user(); 

        Log::info('🗑️ [Notifications] Destroy all read called', [
            'user' => $user ? $user->id : 'null'
        ]);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terotentikasi'
            ], 401);
        }

        
        $deleted = Notification::where('user_id', $user->id)
            ->where('is_read', true)
            ->delete();

        Log::info('✅ [Notifications] Deleted all read', [
            'user_id' => $user->id,
            'count' => $deleted
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi yang sudah dibaca berhasil dihapus',
            'deleted' => $deleted
        ]);
    }

    public static function createNotification($userId, $type, $title, $message, $orderId = null, $data = [])
    {
        try {
            $notification = Notification::create([
                'notification_id' => (string) \Illuminate\Support\Str::uuid(),
                'user_id' => $userId,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'order_id' => $orderId,
                'data' => $data,
                'is_read' => false
            ]);

            Log::info('✅ [Notifications] Created', [
                'notification_id' => $notification->notification_id,
                'user_id' => $userId,
                'type' => $type,
                'order_id' => $orderId
            ]);

            return $notification;
        } catch (\Exception $e) {
            Log::error('❌ [Notifications] Failed to create', [
                'user_id' => $userId,
                'type' => $type,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
}