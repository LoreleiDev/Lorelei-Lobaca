<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

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

        $timeRange = $request->query('time_range');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        if ($startDate && $endDate) {
            Log::info('Filtering by date range', ['start' => $startDate, 'end' => $endDate]);
            $query->whereBetween('created_at', [$startDate, $endDate]);
        } elseif ($timeRange) {
            Log::info('Filtering by time range', ['range' => $timeRange]);
            switch ($timeRange) {
                case 'daily':
                    $query->whereDate('created_at', today());
                    break;
                case 'weekly':
                    $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
                    break;
                case 'monthly':
                    $query->whereMonth('created_at', now()->month)
                        ->whereYear('created_at', now()->year);
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
            Log::error('Admin not authenticated');
            return response()->json(['success' => false, 'message' => 'Admin tidak terotentikasi'], 401);
        }

        $transaksi = Transaksi::with(['transaksiDetail.buku'])->findOrFail($id);
        Log::info('Order found', ['status' => $transaksi->admin_action_status]);

        if ($transaksi->admin_action_status !== 'pending') {
            Log::warning('Order already processed', ['current_status' => $transaksi->admin_action_status]);
            return response()->json([
                'success' => false,
                'message' => 'Transaksi sudah diproses.'
            ], 400);
        }

        DB::beginTransaction();
        try {
            $midtransStatus = $this->getMidtransStatus($transaksi->transaction_id_midtrans);
            Log::info('Midtrans status check', ['status' => $midtransStatus, 'transaction_id' => $transaksi->transaction_id_midtrans]);

            if (in_array($midtransStatus, ['pending'])) {
                Log::info('Attempting to approve Midtrans transaction');
                $this->approveMidtrans($transaksi->transaction_id_midtrans);
            } else {
                Log::warning('Midtrans status is not pending, skipping approve', ['status' => $midtransStatus]);
            }

            $transaksi->update([
                'admin_action_status' => 'approved',
                'admin_id_proses' => $admin->admin_id,
                'status_transaksi' => 'transaksi-sukses'
            ]);

            Log::info('Updating stock after approval');
            $this->reduceStock($transaksi->transaksi_id);

            DB::commit();
            Log::info('Transaction approved successfully', ['order_id' => $id]);

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
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyetujui transaksi: ' . $e->getMessage()
            ], 500);
        }
    }

    public function reject(Request $request, $id)
    {
        Log::info('Admin Reject Called', ['order_id' => $id]);

        $admin = $request->user('admin');
        if (!$admin) {
            Log::error('Admin not authenticated');
            return response()->json([
                'success' => false,
                'message' => 'Admin tidak terotentikasi'
            ], 401);
        }

        $transaksi = Transaksi::with(['transaksiDetail.buku', 'user'])->findOrFail($id);

        if ($transaksi->admin_action_status !== 'pending') {
            Log::warning('Order already processed', ['current_status' => $transaksi->admin_action_status]);
            return response()->json([
                'success' => false,
                'message' => 'Transaksi sudah diproses.'
            ], 400);
        }

        DB::beginTransaction();
        try {
            // Daftar metode pembayaran VA (tidak perlu cancel/refund via Midtrans)
            $vaMethods = [
                'bca_transfer',
                'bni_transfer',
                'bri_transfer',
                'mandiri_transfer',
                'permata_transfer'
            ];

            $isVa = in_array($transaksi->payment_method, $vaMethods);

            // Hanya panggil cancel Midtrans jika BUKAN VA dan status masih pending/expire
            if (!$isVa) {
                $midtransStatus = $this->getMidtransStatus($transaksi->transaction_id_midtrans);
                if (in_array($midtransStatus, ['pending', 'expire'])) {
                    Log::info('Attempting to cancel Midtrans transaction (non-VA)');
                    $this->cancelMidtrans($transaksi->transaction_id_midtrans);
                }
            } else {
                Log::info('Skipping Midtrans cancel for VA payment method: ' . $transaksi->payment_method);
            }

            // Update status transaksi
            $transaksi->update([
                'admin_action_status' => 'rejected',
                'admin_id_proses' => $admin->admin_id,
                'status_transaksi' => 'transaksi-dibatalkan'
            ]);

            // Kembalikan stok (opsional, tapi aman — biasanya belum dikurangi saat checkout)
            $this->restoreStock($transaksi->transaksi_id);

            // Hapus cart & cart items milik user
            $cart = \App\Models\Cart::where('user_id', $transaksi->user_id)->first();
            if ($cart) {
                \App\Models\CartItem::where('cart_id', $cart->cart_id)->delete();
                $cart->delete();
                Log::info('Cart cleared after rejection', ['user_id' => $transaksi->user_id]);
            }

            DB::commit();
            Log::info('Transaction rejected successfully', ['order_id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil ditolak.',
                'data' => $transaksi
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Reject Transaction Error: ' . $e->getMessage(), [
                'order_id' => $id,
                'error_line' => $e->getLine(),
                'error_file' => $e->getFile()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal menolak transaksi: ' . $e->getMessage()
            ], 500);
        }
    }

    public function refund(Request $request, $id)
    {
        Log::info('Admin Refund Called', ['order_id' => $id]);

        $admin = $request->user('admin');
        if (!$admin) {
            Log::error('Admin not authenticated');
            return response()->json(['success' => false, 'message' => 'Admin tidak terotentikasi'], 401);
        }

        $transaksi = Transaksi::findOrFail($id);
        Log::info('Order found', ['status' => $transaksi->admin_action_status]);

        if ($transaksi->admin_action_status !== 'rejected') {
            Log::warning('Refund only allowed for rejected transactions', ['current_status' => $transaksi->admin_action_status]);
            return response()->json([
                'success' => false,
                'message' => 'Refund hanya bisa dilakukan untuk transaksi yang ditolak.'
            ], 400);
        }

        $midtransStatus = $this->getMidtransStatus($transaksi->transaction_id_midtrans);
        if (!in_array($midtransStatus, ['settlement', 'capture'])) {
            Log::warning('Midtrans status not eligible for refund', ['status' => $midtransStatus]);
            return response()->json([
                'success' => false,
                'message' => 'Status transaksi Midtrans tidak memungkinkan untuk refund.'
            ], 400);
        }

        DB::beginTransaction();
        try {
            $this->refundMidtrans($transaksi->transaction_id_midtrans, $transaksi->total_harga, 'Admin refunded order');
            Log::info('Refund executed successfully');

            $transaksi->update([
                'status_transaksi' => 'refunded'
            ]);

            DB::commit();
            Log::info('Transaction refunded successfully', ['order_id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Refund berhasil diproses.',
                'data' => $transaksi
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Refund Transaction Error: ' . $e->getMessage(), [
                'order_id' => $id,
                'error_line' => $e->getLine(),
                'error_file' => $e->getFile()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses refund: ' . $e->getMessage()
            ], 500);
        }
    }

    private function getMidtransStatus($transactionId)
    {
        Log::debug('Getting Midtrans status', ['transaction_id' => $transactionId]);

        if (!$transactionId) {
            Log::error('Transaction ID is empty in getMidtransStatus');
            return 'unknown';
        }

        $serverKey = env('MIDTRANS_SERVER_KEY');
        if (!$serverKey) {
            Log::error('MIDTRANS_SERVER_KEY is not set in environment');
            return 'unknown';
        }

        $encodedKey = base64_encode($serverKey . ':');
        $url = "https://api.sandbox.midtrans.com/v2/{$transactionId}/status";
        Log::debug('Calling Midtrans API', ['url' => $url]);

        $response = Http::withHeaders([
            'Authorization' => 'Basic ' . $encodedKey,
        ])->get($url);

        $contentType = $response->header('Content-Type');
        Log::debug('Midtrans response', [
            'status' => $response->status(),
            'content_type' => $contentType,
            'body' => $response->body()
        ]);

        if (!$response->successful() || !str_contains($contentType, 'application/json')) {
            Log::warning("Midtrans response bukan JSON untuk transaksi {$transactionId}. Response: " . $response->body());
            return 'unknown';
        }

        $responseData = $response->json();
        $status = $responseData['transaction_status'] ?? 'unknown';
        Log::info('Midtrans status retrieved', ['status' => $status]);

        return $status;
    }

    private function approveMidtrans($transactionId)
    {
        Log::debug('Approving Midtrans transaction', ['transaction_id' => $transactionId]);

        if (!$transactionId) {
            Log::error('Transaction ID is empty in approveMidtrans');
            throw new \Exception('Transaction ID is required');
        }

        $serverKey = env('MIDTRANS_SERVER_KEY');
        if (!$serverKey) {
            Log::error('MIDTRANS_SERVER_KEY is not set in environment');
            throw new \Exception('MIDTRANS_SERVER_KEY not configured');
        }

        $encodedKey = base64_encode($serverKey . ':');
        $url = "https://api.sandbox.midtrans.com/v2/{$transactionId}/approve";
        Log::debug('Calling Midtrans Approve API', ['url' => $url]);

        $response = Http::withHeaders([
            'Authorization' => 'Basic ' . $encodedKey,
            'Content-Type' => 'application/json',
        ])->post($url);

        $contentType = $response->header('Content-Type');
        Log::debug('Midtrans approve response', [
            'status' => $response->status(),
            'content_type' => $contentType,
            'body' => $response->body()
        ]);

        if (!$response->successful()) {
            Log::error('HTTP error saat approve Midtrans', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            throw new \Exception('HTTP error saat approve Midtrans: ' . $response->status());
        }

        $body = $response->json();
        if (isset($body['status_code']) && $body['status_code'] !== '200') {
            Log::error('Midtrans approve gagal', [
                'status_code' => $body['status_code'],
                'status_message' => $body['status_message']
            ]);
            throw new \Exception('Midtrans approve gagal: ' . ($body['status_message'] ?? 'Unknown error'));
        }

        Log::info('Midtrans transaction approved successfully');
    }

    private function cancelMidtrans($transactionId)
    {
        Log::debug('Canceling Midtrans transaction', ['transaction_id' => $transactionId]);

        if (!$transactionId) {
            Log::error('Transaction ID is empty in cancelMidtrans');
            throw new \Exception('Transaction ID is required');
        }

        $serverKey = env('MIDTRANS_SERVER_KEY');
        if (!$serverKey) {
            Log::error('MIDTRANS_SERVER_KEY is not set in environment');
            throw new \Exception('MIDTRANS_SERVER_KEY not configured');
        }

        $encodedKey = base64_encode($serverKey . ':');
        $url = "https://api.sandbox.midtrans.com/v2/{$transactionId}/cancel";
        Log::debug('Calling Midtrans Cancel API', ['url' => $url]);

        $response = Http::withHeaders([
            'Authorization' => 'Basic ' . $encodedKey,
            'Content-Type' => 'application/json',
        ])->post($url);

        $contentType = $response->header('Content-Type');
        Log::debug('Midtrans cancel response', [
            'status' => $response->status(),
            'content_type' => $contentType,
            'body' => $response->body()
        ]);

        if (!$response->successful()) {
            Log::error('HTTP error saat cancel Midtrans', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            throw new \Exception('HTTP error saat cancel Midtrans: ' . $response->status());
        }

        $body = $response->json();
        if (isset($body['status_code']) && $body['status_code'] !== '200') {
            Log::error('Midtrans cancel gagal', [
                'status_code' => $body['status_code'],
                'status_message' => $body['status_message']
            ]);
            throw new \Exception('Midtrans cancel gagal: ' . ($body['status_message'] ?? 'Unknown error'));
        }

        Log::info('Midtrans transaction canceled successfully');
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

        if (!$response->successful()) {
            throw new \Exception('HTTP error saat refund Midtrans: ' . $response->status());
        }

        $body = $response->json();
        if (isset($body['status_code']) && $body['status_code'] !== '200') {
            throw new \Exception('Midtrans refund gagal: ' . ($body['status_message'] ?? 'Unknown error'));
        }
    }

    private function reduceStock($transaksiId)
    {
        Log::debug('Reducing stock for transaction', ['transaksi_id' => $transaksiId]);

        $details = \App\Models\TransaksiDetail::where('transaksi_id', $transaksiId)->get();
        Log::debug('Transaction details count', ['count' => $details->count()]);

        foreach ($details as $detail) {
            if ($detail->buku_id) {
                $buku = $detail->buku;
                if ($buku) {
                    Log::info('Reducing stock', [
                        'book_title' => $buku->judul,
                        'current_stock' => $buku->stok,
                        'reduce_by' => $detail->jumlah
                    ]);

                    if ($buku->stok >= $detail->jumlah) {
                        $buku->decrement('stok', $detail->jumlah);
                        Log::info('Stock reduced successfully');
                    } else {
                        Log::error('Insufficient stock', [
                            'book_title' => $buku->judul,
                            'required' => $detail->jumlah,
                            'available' => $buku->stok
                        ]);
                        throw new \Exception("Stok buku {$buku->judul} tidak mencukupi.");
                    }
                } else {
                    Log::error('Book not found', ['buku_id' => $detail->buku_id]);
                    throw new \Exception("Buku dengan ID {$detail->buku_id} tidak ditemukan.");
                }
            } else {
                Log::warning('Buku ID is null in transaction detail', ['detail_id' => $detail->id]);
            }
        }
    }

    private function restoreStock($transaksiId)
    {
        Log::debug('Restoring stock for transaction', ['transaksi_id' => $transaksiId]);

        $details = \App\Models\TransaksiDetail::where('transaksi_id', $transaksiId)->get();
        Log::debug('Transaction details count', ['count' => $details->count()]);

        foreach ($details as $detail) {
            if ($detail->buku_id) {
                $buku = $detail->buku;
                if ($buku) {
                    Log::info('Restoring stock', [
                        'book_title' => $buku->judul,
                        'current_stock' => $buku->stok,
                        'restore_by' => $detail->jumlah
                    ]);

                    $buku->increment('stok', $detail->jumlah);
                    Log::info('Stock restored successfully');
                } else {
                    Log::error('Book not found during stock restore', ['buku_id' => $detail->buku_id]);
                }
            } else {
                Log::warning('Buku ID is null in transaction detail during restore', ['detail_id' => $detail->id]);
            }
        }
    }
}