<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use App\Models\Buku;
use App\Models\Promo;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

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
                    'created_at' => $transaction->created_at->format('Y-m-d H:i:s'),
                    'updated_at' => $transaction->updated_at->format('Y-m-d H:i:s'),
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
                'created_at' => $transaction->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $transaction->updated_at->format('Y-m-d H:i:s'),
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
                    'created_at' => $transaction->created_at->format('Y-m-d H:i:s'),
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
}