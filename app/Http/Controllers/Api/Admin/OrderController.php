<?php
namespace App\Http\Controllers\Api\Admin;

use App\Models\Transaksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
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

            $transaksi = Transaksi::findOrFail($orderId);

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