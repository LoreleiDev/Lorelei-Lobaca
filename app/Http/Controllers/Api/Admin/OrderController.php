<?php
namespace App\Http\Controllers\Api\Admin;

use App\Models\Transaksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Mail;
use App\Mail\OrderShippedNotification;
use App\Traits\Notifiable;

class OrderController extends Controller
{
    use Notifiable;

    public function updateShipping(Request $request, $orderId)
    {
        try {
            $admin = $request->user('admin');

            if (!$admin) {
                return response()->json([
                    'message' => 'Admin tidak terotentikasi'
                ], 401);
            }

            $validated = $request->validate([
                'resi' => 'required|string|max:255',
                'tanggal_dikirim' => 'required|date',
            ]);

            $transaksi = Transaksi::with(['user'])->findOrFail($orderId);

            if ($transaksi->admin_action_status !== 'approved' || $transaksi->status_transaksi === 'pesanan-sedang-dikirim') {
                return response()->json([
                    'message' => 'Pesanan tidak dalam status yang dapat diproses untuk pengiriman'
                ], 400);
            }

            DB::beginTransaction();

            $transaksi->update([
                'resi_pengiriman' => $validated['resi'],
                'tanggal_dikirim' => $validated['tanggal_dikirim'],
                'status_transaksi' => 'pesanan-sedang-dikirim',
                'admin_action_status' => 'shipped',
                'admin_id_proses' => $admin->admin_id,
            ]);

            DB::commit();


            $this->sendShippingUpdateNotification(
                $transaksi->user_id,
                $transaksi->transaksi_id,
                $transaksi->kurir ?? 'JNE',
                $transaksi->resi_pengiriman
            );

            Log::info('Notification sent for shipping update', [
                'order_id' => $transaksi->transaksi_id,
                'user_id' => $transaksi->user_id
            ]);

            try {
                Mail::to($transaksi->user->email)->send(new OrderShippedNotification($transaksi, $transaksi->user));
                Log::info('Shipped email sent to user', ['email' => $transaksi->user->email]);
            } catch (\Exception $mailError) {
                Log::warning('Failed to send shipped email', [
                    'email' => $transaksi->user->email,
                    'error' => $mailError->getMessage()
                ]);
            }

            return response()->json([
                'message' => 'Pengiriman berhasil diperbarui',
                'data' => [
                    'transaksi_id' => $transaksi->transaksi_id,
                    'resi_pengiriman' => $transaksi->resi_pengiriman,
                    'tanggal_dikirim' => $transaksi->tanggal_dikirim,
                    'status_transaksi' => $transaksi->status_transaksi,
                    'admin_action_status' => $transaksi->admin_action_status
                ]
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollback();
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error updating shipping: ' . $e->getMessage(), [
                'order_id' => $orderId,
                'admin_id' => $admin->admin_id ?? 'unknown',
                'error_line' => $e->getLine(),
                'error_file' => $e->getFile()
            ]);
            return response()->json([
                'message' => 'Gagal memperbarui data pengiriman',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}