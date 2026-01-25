<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Transaksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use App\Mail\OrderRejectedNotification;

class TransaksiController extends Controller
{
    public function index(Request $request)
    {
        Log::info('Admin Orders Index Called', ['query_params' => $request->all()]);
        $query = Transaksi::with(['user:id,first_name,last_name,email', 'transaksiDetail.buku']);

        $status = $request->query('status');
        if ($status) {
            Log::info('Filtering by status', ['status' => $status]);
            $query->where('admin_action_status', $status);
        }

        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        if ($startDate && $endDate) {
            Log::info('Filtering by date range', ['start' => $startDate, 'end' => $endDate]);
            $query->whereBetween('created_at', [$startDate, $endDate]);
        } elseif ($timeRange = $request->query('time_range')) {
            Log::info('Filtering by time range', ['range' => $timeRange]);
            switch ($timeRange) {
                case 'daily':
                    $query->whereDate('created_at', today());
                    break;
                case 'weekly':
                    $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
                    break;
                case 'monthly':
                    $query->whereMonth('created_at', now()->month)->whereYear('created_at', now()->year);
                    break;
                case 'yearly':
                    $query->whereYear('created_at', now()->year);
                    break;
                default:
                    Log::warning('Invalid time_range parameter', ['time_range' => $timeRange]);
            }
        }

        $transaksi = $query->orderBy('created_at', 'desc')->get()->map(function ($t) {
            if ($t->user) {
                $t->user->name = trim($t->user->first_name . ' ' . $t->user->last_name);
            }
            $midtransStatus = $this->getMidtransStatus($t->transaction_id_midtrans);
            $t->setAttribute('payment_status', $midtransStatus);

            if ($midtransStatus === 'expire' && $t->status_transaksi !== 'transaksi-kadaluarsa') {
                $t->update(['status_transaksi' => 'transaksi-kadaluarsa']);
                $t->refresh();
            }

            return $t;
        });

        $totalPendapatan = $transaksi->where('admin_action_status', 'approved')->sum('total_harga');

        return response()->json([
            'success' => true,
            'data' => $transaksi,
            'total_pendapatan' => $totalPendapatan
        ]);
    }

    public function approve(Request $request, $id)
    {
        Log::info('Admin Approve Called', ['order_id' => $id]);
        $admin = $request->user('admin');
        if (!$admin) {
            return response()->json(['success' => false, 'message' => 'Admin tidak terotentikasi'], 401);
        }

        $transaksi = Transaksi::with(['transaksiDetail.buku'])->findOrFail($id);

        if ($transaksi->admin_action_status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Transaksi sudah diproses.'], 400);
        }
        if ($transaksi->status_transaksi === 'transaksi-kadaluarsa') {
            return response()->json(['success' => false, 'message' => 'Transaksi sudah kadaluarsa.'], 400);
        }

        DB::beginTransaction();
        try {
            $midtransStatus = $this->getMidtransStatus($transaksi->transaction_id_midtrans);

            if (in_array($midtransStatus, ['pending'])) {
                $this->approveMidtrans($transaksi->transaction_id_midtrans);
            }

            $transaksi->update([
                'admin_action_status' => 'approved',
                'admin_id_proses' => $admin->admin_id,
                'status_transaksi' => 'transaksi-sukses'
            ]);

            $this->reduceStock($transaksi->transaksi_id);
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil disetujui.',
                'data' => $transaksi
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Approve Transaction Error: ' . $e->getMessage(), [
                'order_id' => $id,
                'error_line' => $e->getLine(),
                'error_file' => $e->getFile()
            ]);
            return response()->json(['success' => false, 'message' => 'Gagal menyetujui transaksi: ' . $e->getMessage()], 500);
        }
    }

    public function rejectAndRefund(Request $request, $id)
    {
        Log::info('Admin Reject & Refund Called', ['order_id' => $id]);
        $admin = $request->user('admin');
        if (!$admin) {
            return response()->json(['success' => false, 'message' => 'Admin tidak terotentikasi'], 401);
        }

        $transaksi = Transaksi::with(['transaksiDetail.buku', 'user'])->findOrFail($id);

        if ($transaksi->admin_action_status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Transaksi sudah diproses.'], 400);
        }
        if ($transaksi->status_transaksi === 'transaksi-kadaluarsa') {
            return response()->json(['success' => false, 'message' => 'Transaksi sudah kadaluarsa.'], 400);
        }

        DB::beginTransaction();
        try {
            $midtransStatus = $this->getMidtransStatus($transaksi->transaction_id_midtrans);
            Log::info('Midtrans status for refund decision', ['status' => $midtransStatus]);

            if (in_array($midtransStatus, ['settlement', 'capture'])) {
                Log::info('Refunding settled transaction');
                $this->refundMidtrans($transaksi->transaction_id_midtrans, $transaksi->total_harga, 'Dibatalkan oleh admin');
            } elseif (in_array($midtransStatus, ['pending', 'expire'])) {
                Log::info('Canceling pending/expire transaction');
                $this->cancelMidtrans($transaksi->transaction_id_midtrans);
            }

            $transaksi->update([
                'admin_action_status' => 'rejected',
                'admin_id_proses' => $admin->admin_id,
                'status_transaksi' => 'transaksi-ditolak'
            ]);

            $this->restoreStock($transaksi->transaksi_id);

            // Clear cart
            $cart = \App\Models\Cart::where('user_id', $transaksi->user_id)->first();
            if ($cart) {
                \App\Models\CartItem::where('cart_id', $cart->cart_id)->delete();
                $cart->delete();
                Log::info('Cart cleared after rejection', ['user_id' => $transaksi->user_id]);
            }

            DB::commit();
            Log::info('Transaction rejected and refunded successfully', ['order_id' => $id]);

            try {
                Mail::to($transaksi->user->email)->send(new OrderRejectedNotification($transaksi, $transaksi->user));
                Log::info('Rejection email sent to user', ['email' => $transaksi->user->email]);
            } catch (\Exception $mailError) {
                Log::warning('Failed to send rejection email', [
                    'email' => $transaksi->user->email,
                    'error' => $mailError->getMessage()
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil dibatalkan dan dana dikembalikan.',
                'data' => $transaksi
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil dibatalkan dan dana dikembalikan.',
                'data' => $transaksi
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Reject & Refund Error: ' . $e->getMessage(), [
                'order_id' => $id,
                'error_line' => $e->getLine(),
                'error_file' => $e->getFile()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal membatalkan transaksi: ' . $e->getMessage()
            ], 500);
        }
    }

    private function getMidtransStatus($transactionId)
    {
        if (!$transactionId)
            return 'unknown';
        $serverKey = env('MIDTRANS_SERVER_KEY');
        if (!$serverKey)
            return 'unknown';

        $encodedKey = base64_encode($serverKey . ':');
        $url = "https://api.sandbox.midtrans.com/v2/{$transactionId}/status";

        $response = Http::withHeaders(['Authorization' => 'Basic ' . $encodedKey])->get($url);

        if (!$response->successful() || !str_contains($response->header('Content-Type'), 'application/json')) {
            return 'unknown';
        }

        return $response->json()['transaction_status'] ?? 'unknown';
    }

    private function approveMidtrans($transactionId)
    {
        $serverKey = env('MIDTRANS_SERVER_KEY');
        $encodedKey = base64_encode($serverKey . ':');
        $url = "https://api.sandbox.midtrans.com/v2/{$transactionId}/approve";
        $response = Http::withHeaders([
            'Authorization' => 'Basic ' . $encodedKey,
            'Content-Type' => 'application/json',
        ])->post($url);

        if (!$response->successful() || ($response->json()['status_code'] ?? null) !== '200') {
            throw new \Exception('Gagal approve Midtrans');
        }
    }

    private function cancelMidtrans($transactionId)
    {
        $serverKey = env('MIDTRANS_SERVER_KEY');
        $encodedKey = base64_encode($serverKey . ':');
        $url = "https://api.sandbox.midtrans.com/v2/{$transactionId}/cancel";
        $response = Http::withHeaders([
            'Authorization' => 'Basic ' . $encodedKey,
            'Content-Type' => 'application/json',
        ])->post($url);

        if (!$response->successful() || ($response->json()['status_code'] ?? null) !== '200') {
            throw new \Exception('Gagal cancel Midtrans');
        }
    }

    private function refundMidtrans($transactionId, $amount, $reason = 'Admin refunded order')
    {
        $serverKey = env('MIDTRANS_SERVER_KEY');
        $encodedKey = base64_encode($serverKey . ':');
        $url = "https://api.sandbox.midtrans.com/v2/{$transactionId}/refund";
        $payload = [
            'refund_key' => uniqid('refund_', true),
            'amount' => (int) $amount,
            'reason' => $reason
        ];
        $response = Http::withHeaders([
            'Authorization' => 'Basic ' . $encodedKey,
            'Content-Type' => 'application/json',
        ])->post($url, $payload);

        if (!$response->successful() || ($response->json()['status_code'] ?? null) !== '200') {
            throw new \Exception('Gagal refund Midtrans: ' . ($response->json()['status_message'] ?? 'Unknown'));
        }
    }

    private function reduceStock($transaksiId)
    {
        $details = \App\Models\TransaksiDetail::where('transaksi_id', $transaksiId)->get();
        foreach ($details as $detail) {
            if ($detail->buku_id && $detail->buku) {
                if ($detail->buku->stok >= $detail->jumlah) {
                    $detail->buku->decrement('stok', $detail->jumlah);
                } else {
                    throw new \Exception("Stok buku {$detail->buku->judul} tidak mencukupi.");
                }
            }
        }
    }

    private function restoreStock($transaksiId)
    {
        $details = \App\Models\TransaksiDetail::where('transaksi_id', $transaksiId)->get();
        foreach ($details as $detail) {
            if ($detail->buku_id && $detail->buku) {
                $detail->buku->increment('stok', $detail->jumlah);
            }
        }
    }
}