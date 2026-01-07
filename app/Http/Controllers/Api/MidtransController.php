<?php

namespace App\Http\Controllers\Api;

use App\Models\Buku;
use App\Models\Transaksi;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;

class MidtransController extends Controller
{
    /**
     * Handle Midtrans notification.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function notification(Request $request): JsonResponse
    {
        $notification = $request->all();

        $orderId = $notification['order_id'];
        $transactionStatus = $notification['transaction_status'];
        $fraudStatus = $notification['fraud_status'] ?? 'accept';

        $transaksi = Transaksi::where('transaction_id_midtrans', $orderId)->first();

        if (!$transaksi) {
            Log::warning('Transaksi tidak ditemukan untuk order_id: ' . $orderId);
            return response()->json(['status' => 'error', 'message' => 'Transaction not found'], 404);
        }

        $serverKey = env('MIDTRANS_SERVER_KEY');
        $inputKey = $serverKey;
        $signature = hash("sha512", $orderId . $notification['status_code'] . $notification['gross_amount'] . $inputKey);

        if ($signature !== $notification['signature_key']) {
            Log::error('Midtrans Signature Verification Failed for order_id: ' . $orderId);
            return response()->json(['status' => 'error', 'message' => 'Invalid signature'], 400);
        }

        $oldStatus = $transaksi->status_transaksi;

        if ($transactionStatus == 'capture' || $transactionStatus == 'settlement') {
            if ($fraudStatus == 'accept') {
                $transaksi->status_transaksi = 'transaksi-sukses';
            } else if ($fraudStatus == 'challenge') {
                $transaksi->status_transaksi = 'pesanan-ditunda';
            }
        } else if ($transactionStatus == 'pending') {
            $transaksi->status_transaksi = 'transaksi-diproses';
        } else if ($transactionStatus == 'deny') {
            $transaksi->status_transaksi = 'transaksi-ditolak';
        } else if ($transactionStatus == 'cancel') {
            $transaksi->status_transaksi = 'transaksi-dibatalkan';
        } else if ($transactionStatus == 'expire') {
            $transaksi->status_transaksi = 'transaksi-kadaluarsa';
        }


        if ($transaksi->status_transaksi === 'transaksi-sukses' && $oldStatus !== 'transaksi-sukses') {
            foreach ($transaksi->transaksiDetails as $detail) {
                $buku = Buku::find($detail->buku_id);
                if ($buku) {
                    $buku->decrement('stok', $detail->jumlah);
                }
            }
        }

        $transaksi->save();

        Log::info('Midtrans Notification Handled for order_id: ' . $orderId . ', new status: ' . $transaksi->status_transaksi);

        return response()->json(['status' => 'OK'], 200);
    }
}