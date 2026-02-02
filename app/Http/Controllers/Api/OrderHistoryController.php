<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaksi;
use App\Models\Promo;
use App\Models\TransaksiDetail;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class OrderHistoryController extends Controller
{
    public function getUserTransactions(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            Log::error('Order History Error: User not authenticated');
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        try {
            $now = Carbon::now('Asia/Jakarta');

            $transactions = Transaksi::where('user_id', $user->id)
                ->with([
                    'details.buku' => function ($query) use ($now) {
                        $query->withAvg('reviews', 'rating');
                    }
                ])
                ->orderBy('created_at', 'desc')
                ->get();

            $formattedTransactions = $transactions->map(function ($transaction) use ($now) {
                return [
                    'transaksi_id' => $transaction->transaksi_id,
                    'order_id' => $transaction->transaction_id_midtrans,
                    'total_harga' => $transaction->total_harga,
                    'total_berat' => $transaction->total_berat,
                    'alamat_pengiriman' => $transaction->alamat_pengiriman,
                    'kurir' => $transaction->kurir,
                    'ongkir' => $transaction->ongkir,
                    'status_transaksi' => $transaction->status_transaksi,
                    'admin_action_status' => $transaction->admin_action_status,
                    'payment_method' => $transaction->payment_method,
                    'created_at' => $transaction->created_at?->format('Y-m-d H:i:s'),
                    'updated_at' => $transaction->updated_at?->format('Y-m-d H:i:s'),
                    // Informasi pengiriman baru - pengecekan aman
                    'tanggal_dikirim' => $transaction->tanggal_dikirim 
                        ? (is_string($transaction->tanggal_dikirim) 
                            ? $transaction->tanggal_dikirim 
                            : $transaction->tanggal_dikirim->format('Y-m-d H:i:s'))
                        : null,
                    'nomor_resi' => $transaction->nomor_resi,
                    'items' => $transaction->details->map(function ($detail) use ($now) {
                        $buku = $detail->buku;
                        
                        $activePromo = Promo::whereHas('books', function ($q) use ($buku) {
                            $q->where('promo_buku.buku_id', $buku->buku_id);
                        })
                            ->where(function ($q) use ($now) {
                                $q->where('start_date', '<', $now->toDateString())
                                    ->orWhere(function ($sub) use ($now) {
                                        $sub->where('start_date', '=', $now->toDateString())
                                            ->where('start_time', '<=', $now->format('H:i'));
                                    });
                            })
                            ->where(function ($q) use ($now) {
                                $q->where('end_date', '>', $now->toDateString())
                                    ->orWhere(function ($sub) use ($now) {
                                        $sub->where('end_date', '=', $now->toDateString())
                                            ->where('end_time', '>', $now->format('H:i'));
                                    });
                            })
                            ->first();

                        $discountPercent = null;
                        $discountPrice = (int) $buku->harga;

                        if ($activePromo) {
                            $promoBook = $activePromo->books()->where('promo_buku.buku_id', $buku->buku_id)->first();
                            if ($promoBook && $promoBook->pivot) {
                                $discountPercent = $promoBook->pivot->discount_percent;
                                if (is_numeric($discountPercent) && $discountPercent > 0) {
                                    $discountPrice = $buku->harga - ($buku->harga * $discountPercent / 100);
                                }
                            }
                        }

                        return [
                            'detail_id' => $detail->detail_id,
                            'buku_id' => $buku->buku_id,
                            'judul' => $buku->judul,
                            'penulis' => $buku->penulis,
                            'penerbit' => $buku->penerbit,
                            'tahun' => $buku->tahun,
                            'isbn' => $buku->isbn,
                            'stok' => $buku->stok,
                            'berat' => $buku->berat,
                            'kondisi' => $buku->kondisi,
                            'gambar' => $buku->foto, 
                            'deskripsi' => $buku->deskripsi,
                            'kategori' => $buku->kategori,
                            'jumlah' => $detail->jumlah,
                            'harga_satuan' => $detail->harga_satuan,
                            'subtotal' => $detail->harga_satuan * $detail->jumlah,
                            'rating_avg' => $buku->reviews_avg_rating ?? 0,
                            'original_price' => (int) $buku->harga,
                            'discount_price' => $discountPrice,
                            'discount_percent' => $discountPercent,
                            'has_promo' => $activePromo ? true : false,
                            'promo_name' => $activePromo ? $activePromo->name : null,
                        ];
                    })
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Riwayat pesanan berhasil diambil.',
                'data' => $formattedTransactions,
                'count' => $formattedTransactions->count()
            ], 200);

        } catch (\Exception $e) {
            Log::error('Order History Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil riwayat pesanan.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getTransactionDetails(Request $request, $transaksiId): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            Log::error('Transaction Details Error: User not authenticated');
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        try {
            $now = Carbon::now('Asia/Jakarta');

            $transaction = Transaksi::where('user_id', $user->id)
                ->where('transaksi_id', $transaksiId)
                ->with([
                    'details.buku' => function ($query) use ($now) {
                        $query->withAvg('reviews', 'rating');
                    }
                ])
                ->first();

            if (!$transaction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transaksi tidak ditemukan.'
                ], 404);
            }

            $formattedTransaction = [
                'transaksi_id' => $transaction->transaksi_id,
                'order_id' => $transaction->transaction_id_midtrans,
                'total_harga' => $transaction->total_harga,
                'total_berat' => $transaction->total_berat,
                'alamat_pengiriman' => $transaction->alamat_pengiriman,
                'kurir' => $transaction->kurir,
                'ongkir' => $transaction->ongkir,
                'status_transaksi' => $transaction->status_transaksi,
                'admin_action_status' => $transaction->admin_action_status,
                'payment_method' => $transaction->payment_method,
                'created_at' => $transaction->created_at?->format('Y-m-d H:i:s'),
                'updated_at' => $transaction->updated_at?->format('Y-m-d H:i:s'),
                'tanggal_dikirim' => $transaction->tanggal_dikirim 
                    ? (is_string($transaction->tanggal_dikirim) 
                        ? $transaction->tanggal_dikirim 
                        : $transaction->tanggal_dikirim->format('Y-m-d H:i:s'))
                    : null,
                'nomor_resi' => $transaction->nomor_resi,
                'items' => $transaction->details->map(function ($detail) use ($now) {
                    $buku = $detail->buku;
                    
                    $activePromo = Promo::whereHas('books', function ($q) use ($buku) {
                        $q->where('promo_buku.buku_id', $buku->buku_id);
                    })
                        ->where(function ($q) use ($now) {
                            $q->where('start_date', '<', $now->toDateString())
                                ->orWhere(function ($sub) use ($now) {
                                    $sub->where('start_date', '=', $now->toDateString())
                                        ->where('start_time', '<=', $now->format('H:i'));
                                });
                        })
                        ->where(function ($q) use ($now) {
                            $q->where('end_date', '>', $now->toDateString())
                                ->orWhere(function ($sub) use ($now) {
                                    $sub->where('end_date', '=', $now->toDateString())
                                        ->where('end_time', '>', $now->format('H:i'));
                                });
                        })
                        ->first();

                    $discountPercent = null;
                    $discountPrice = (int) $buku->harga;

                    if ($activePromo) {
                        $promoBook = $activePromo->books()->where('promo_buku.buku_id', $buku->buku_id)->first();
                        if ($promoBook && $promoBook->pivot) {
                            $discountPercent = $promoBook->pivot->discount_percent;
                            if (is_numeric($discountPercent) && $discountPercent > 0) {
                                $discountPrice = $buku->harga - ($buku->harga * $discountPercent / 100);
                            }
                        }
                    }

                    return [
                        'detail_id' => $detail->detail_id,
                        'buku_id' => $buku->buku_id,
                        'judul' => $buku->judul,
                        'penulis' => $buku->penulis,
                        'penerbit' => $buku->penerbit,
                        'tahun' => $buku->tahun,
                        'isbn' => $buku->isbn,
                        'stok' => $buku->stok,
                        'berat' => $buku->berat,
                        'kondisi' => $buku->kondisi,
                        'gambar' => $buku->foto, 
                        'deskripsi' => $buku->deskripsi,
                        'kategori' => $buku->kategori,
                        'jumlah' => $detail->jumlah,
                        'harga_satuan' => $detail->harga_satuan,
                        'subtotal' => $detail->harga_satuan * $detail->jumlah,
                        'rating_avg' => $buku->reviews_avg_rating ?? 0,
                        'original_price' => (int) $buku->harga,
                        'discount_price' => $discountPrice,
                        'discount_percent' => $discountPercent,
                        'has_promo' => $activePromo ? true : false,
                        'promo_name' => $activePromo ? $activePromo->name : null,
                    ];
                })
            ];

            return response()->json([
                'success' => true,
                'message' => 'Detail transaksi berhasil diambil.',
                'data' => $formattedTransaction
            ], 200);

        } catch (\Exception $e) {
            Log::error('Transaction Details Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil detail transaksi.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function filterTransactionsByStatus(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            Log::error('Filter Transactions Error: User not authenticated');
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $status = $request->input('status');

        if (!$status) {
            return response()->json([
                'success' => false,
                'message' => 'Status harus ditentukan.'
            ], 400);
        }

        try {
            $now = Carbon::now('Asia/Jakarta');

            $transactions = Transaksi::where('user_id', $user->id)
                ->where('status_transaksi', $status)
                ->with([
                    'details.buku' => function ($query) use ($now) {
                        $query->withAvg('reviews', 'rating');
                    }
                ])
                ->orderBy('created_at', 'desc')
                ->get();

            $formattedTransactions = $transactions->map(function ($transaction) use ($now) {
                return [
                    'transaksi_id' => $transaction->transaksi_id,
                    'order_id' => $transaction->transaction_id_midtrans,
                    'total_harga' => $transaction->total_harga,
                    'status_transaksi' => $transaction->status_transaksi,
                    'payment_method' => $transaction->payment_method,
                    'created_at' => $transaction->created_at?->format('Y-m-d H:i:s'),
                    'items_count' => $transaction->details->count(),
                    'items' => $transaction->details->map(function ($detail) use ($now) {
                        $buku = $detail->buku;
                        
                        $activePromo = Promo::whereHas('books', function ($q) use ($buku) {
                            $q->where('promo_buku.buku_id', $buku->buku_id);
                        })
                            ->where(function ($q) use ($now) {
                                $q->where('start_date', '<', $now->toDateString())
                                    ->orWhere(function ($sub) use ($now) {
                                        $sub->where('start_date', '=', $now->toDateString())
                                            ->where('start_time', '<=', $now->format('H:i'));
                                    });
                            })
                            ->where(function ($q) use ($now) {
                                $q->where('end_date', '>', $now->toDateString())
                                    ->orWhere(function ($sub) use ($now) {
                                        $sub->where('end_date', '=', $now->toDateString())
                                            ->where('end_time', '>', $now->format('H:i'));
                                    });
                            })
                            ->first();

                        $discountPercent = null;
                        $discountPrice = (int) $buku->harga;

                        if ($activePromo) {
                            $promoBook = $activePromo->books()->where('promo_buku.buku_id', $buku->buku_id)->first();
                            if ($promoBook && $promoBook->pivot) {
                                $discountPercent = $promoBook->pivot->discount_percent;
                                if (is_numeric($discountPercent) && $discountPercent > 0) {
                                    $discountPrice = $buku->harga - ($buku->harga * $discountPercent / 100);
                                }
                            }
                        }

                        return [
                            'buku_id' => $buku->buku_id,
                            'judul' => $buku->judul,
                            'gambar' => $buku->foto,
                            'jumlah' => $detail->jumlah,
                            'harga_satuan' => $detail->harga_satuan,
                            'subtotal' => $detail->harga_satuan * $detail->jumlah,
                            'original_price' => (int) $buku->harga,
                            'discount_price' => $discountPrice,
                            'discount_percent' => $discountPercent,
                            'has_promo' => $activePromo ? true : false,
                        ];
                    })
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil difilter.',
                'data' => $formattedTransactions,
                'count' => $formattedTransactions->count()
            ], 200);

        } catch (\Exception $e) {
            Log::error('Filter Transactions Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memfilter transaksi.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel Order by User
     * Hanya bisa dibatalkan jika status transaksi-sukses dan admin_action_status approved
     */
    public function cancelOrder(Request $request, $transaksiId): JsonResponse
    {
        Log::info('User Cancel Order Called', ['transaksi_id' => $transaksiId]);
        
        $user = $request->user();

        if (!$user) {
            Log::error('Cancel Order Error: User not authenticated');
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $transaksi = Transaksi::with(['details.buku'])->where('user_id', $user->id)->findOrFail($transaksiId);

        // Validasi: hanya bisa dibatalkan jika status transaksi-sukses dan admin_action_status approved
        if ($transaksi->status_transaksi !== 'transaksi-sukses') {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan hanya dapat dibatalkan jika status "Transaksi Sukses".'
            ], 400);
        }

        if ($transaksi->admin_action_status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan belum disetujui admin, tidak dapat dibatalkan.'
            ], 400);
        }

        // Cek apakah sudah ada status pembatalan sebelumnya
        if (in_array($transaksi->status_transaksi, ['transaksi-dibatalkan', 'transaksi-ditolak'])) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan sudah dibatalkan sebelumnya.'
            ], 400);
        }

        DB::beginTransaction();
        try {
            // Cek status Midtrans
            $midtransStatus = $this->getMidtransStatus($transaksi->transaction_id_midtrans);
            Log::info('Midtrans status for refund decision', ['status' => $midtransStatus]);

            // Proses refund/cancel di Midtrans
            if (in_array($midtransStatus, ['settlement', 'capture'])) {
                Log::info('Refunding settled transaction');
                $this->refundMidtrans($transaksi->transaction_id_midtrans, $transaksi->total_harga, 'Dibatalkan oleh user');
            } elseif (in_array($midtransStatus, ['pending', 'expire'])) {
                Log::info('Canceling pending/expire transaction');
                $this->cancelMidtrans($transaksi->transaction_id_midtrans);
            }

            // Update status transaksi
            $transaksi->update([
                'admin_action_status' => 'rejected',
                'status_transaksi' => 'transaksi-dibatalkan',
                'updated_at' => Carbon::now('Asia/Jakarta')
            ]);

            // Restore stock
            $this->restoreStock($transaksi->transaksi_id);

            // Clear cart
            $cart = \App\Models\Cart::where('user_id', $transaksi->user_id)->first();
            if ($cart) {
                \App\Models\CartItem::where('cart_id', $cart->cart_id)->delete();
                $cart->delete();
                Log::info('Cart cleared after user cancellation', ['user_id' => $transaksi->user_id]);
            }

            DB::commit();

            Log::info('Transaction cancelled by user successfully', ['transaksi_id' => $transaksiId]);

            return response()->json([
                'success' => true,
                'message' => 'Pesanan berhasil dibatalkan dan dana akan dikembalikan.',
                'data' => $transaksi
            ], 200);

        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Cancel Order Error: ' . $e->getMessage(), [
                'transaksi_id' => $transaksiId,
                'error_line' => $e->getLine(),
                'error_file' => $e->getFile()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal membatalkan pesanan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update Status by User
     * Misal: pesanan-sedang-dikirim -> pesanan-telah-diterima
     */
    public function updateStatus(Request $request, $transaksiId): JsonResponse
    {
        Log::info('User Update Status Called', ['transaksi_id' => $transaksiId]);
        
        $user = $request->user();

        if (!$user) {
            Log::error('Update Status Error: User not authenticated');
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $transaksi = Transaksi::where('user_id', $user->id)->findOrFail($transaksiId);

        $newStatus = $request->input('status');

        if (!$newStatus) {
            return response()->json([
                'success' => false,
                'message' => 'Status harus ditentukan.'
            ], 400);
        }

        $allowedStatusChanges = [
            'pesanan-sedang-dikirim' => ['pesanan-telah-diterima'],
        ];

        $currentStatus = $transaksi->status_transaksi;

        if (!isset($allowedStatusChanges[$currentStatus]) || 
            !in_array($newStatus, $allowedStatusChanges[$currentStatus])) {
            return response()->json([
                'success' => false,
                'message' => 'Perubahan status tidak diperbolehkan.'
            ], 400);
        }

        DB::beginTransaction();
        try {
            $transaksi->update([
                'status_transaksi' => $newStatus,
                'updated_at' => Carbon::now('Asia/Jakarta')
            ]);

            DB::commit();

            Log::info('Transaction status updated by user', [
                'transaksi_id' => $transaksiId,
                'from' => $currentStatus,
                'to' => $newStatus
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Status pesanan berhasil diubah.',
                'data' => $transaksi
            ], 200);

        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Update Status Error: ' . $e->getMessage(), [
                'transaksi_id' => $transaksiId,
                'error_line' => $e->getLine(),
                'error_file' => $e->getFile()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengubah status pesanan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper: Get Midtrans Transaction Status
     */
    private function getMidtransStatus($transactionId)
    {
        if (!$transactionId) {
            return 'unknown';
        }

        $serverKey = env('MIDTRANS_SERVER_KEY');
        if (!$serverKey) {
            return 'unknown';
        }

        $encodedKey = base64_encode($serverKey . ':');
        $url = "https://api.sandbox.midtrans.com/v2/{$transactionId}/status";

        try {
            $response = Http::withHeaders(['Authorization' => 'Basic ' . $encodedKey])->get($url);
            
            if (!$response->successful() || !str_contains($response->header('Content-Type'), 'application/json')) {
                return 'unknown';
            }

            return $response->json()['transaction_status'] ?? 'unknown';
        } catch (\Exception $e) {
            Log::error('Get Midtrans Status Error: ' . $e->getMessage());
            return 'unknown';
        }
    }

    /**
     * Helper: Cancel Midtrans Transaction
     */
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
            throw new \Exception('Gagal cancel Midtrans: ' . ($response->json()['status_message'] ?? 'Unknown'));
        }
    }

    /**
     * Helper: Refund Midtrans Transaction
     */
    private function refundMidtrans($transactionId, $amount, $reason = 'User cancelled order')
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

    /**
     * Helper: Restore Stock
     */
    private function restoreStock($transaksiId)
    {
        $details = TransaksiDetail::where('transaksi_id', $transaksiId)->get();
        
        foreach ($details as $detail) {
            if ($detail->buku_id && $detail->buku) {
                $detail->buku->increment('stok', $detail->jumlah);
                Log::info('Stock restored', [
                    'buku_id' => $detail->buku_id,
                    'judul' => $detail->buku->judul,
                    'jumlah' => $detail->jumlah
                ]);
            }
        }
    }
}