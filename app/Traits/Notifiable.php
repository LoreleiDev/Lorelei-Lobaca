<?php
namespace App\Traits;

use App\Models\Notification;

trait Notifiable
{
    protected function sendOrderProcessedNotification($userId, $orderId, $data = [])
    {
        Notification::create([
            'notification_id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $userId,
            'type' => 'order_processed',
            'title' => 'Pesanan Diproses',
            'message' => "Pesanan #{$orderId} sedang diproses oleh penjual.",
            'order_id' => $orderId,
            'data' => $data,
            'is_read' => false
        ]);
    }

    protected function sendOrderSuccessNotification($userId, $orderId, $total = 0)
    {
        Notification::create([
            'notification_id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $userId,
            'type' => 'order_success',
            'title' => 'Pesanan Berhasil',
            'message' => "Pesanan #{$orderId} telah berhasil diproses dan akan segera dikirim.",
            'order_id' => $orderId,
            'data' => ['total' => $total],
            'is_read' => false
        ]);
    }

    protected function sendOrderCancelledNotification($userId, $orderId, $reason = '')
    {
        Notification::create([
            'notification_id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $userId,
            'type' => 'order_cancelled',
            'title' => 'Pesanan Dibatalkan',
            'message' => "Pesanan #{$orderId} telah dibatalkan." . ($reason ? " Alasan: {$reason}" : ''),
            'order_id' => $orderId,
            'data' => ['reason' => $reason],
            'is_read' => false
        ]);
    }

    protected function sendShippingUpdateNotification($userId, $orderId, $courier = '', $trackingNumber = '')
    {
        Notification::create([
            'notification_id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $userId,
            'type' => 'shipping_update',
            'title' => 'Update Pengiriman',
            'message' => "Pesanan #{$orderId} sedang dalam pengiriman dengan kurir {$courier}." . ($trackingNumber ? " No. Resi: {$trackingNumber}" : ''),
            'order_id' => $orderId,
            'data' => [
                'courier' => $courier,
                'tracking_number' => $trackingNumber
            ],
            'is_read' => false
        ]);
    }

    protected function sendOrderExpiredNotification($userId, $orderId)
    {
        Notification::create([
            'notification_id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $userId,
            'type' => 'order_expired',
            'title' => 'Pesanan Kadaluarsa',
            'message' => "Pesanan #{$orderId} telah kadaluarsa karena tidak melakukan pembayaran.",
            'order_id' => $orderId,
            'data' => [],
            'is_read' => false
        ]);
    }

    protected function sendPaymentSuccessNotification($userId, $orderId, $amount = 0)
    {
        Notification::create([
            'notification_id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $userId,
            'type' => 'payment_success',
            'title' => 'Pembayaran Berhasil',
            'message' => "Pembayaran untuk pesanan #{$orderId} sebesar Rp " . number_format($amount, 0, ',', '.') . " telah berhasil.",
            'order_id' => $orderId,
            'data' => ['amount' => $amount],
            'is_read' => false
        ]);
    }

    protected function sendPaymentFailedNotification($userId, $orderId)
    {
        Notification::create([
            'notification_id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $userId,
            'type' => 'payment_failed',
            'title' => 'Pembayaran Gagal',
            'message' => "Pembayaran untuk pesanan #{$orderId} gagal. Silakan coba lagi.",
            'order_id' => $orderId,
            'data' => [],
            'is_read' => false
        ]);
    }
}