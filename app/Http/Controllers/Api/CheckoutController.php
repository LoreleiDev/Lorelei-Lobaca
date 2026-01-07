<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Buku;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Promo;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http; // Diperlukan untuk memanggil API Rajaongkir
use Illuminate\Support\Facades\Log; // Diperlukan untuk logging

class CheckoutController extends Controller
{
    /**
     * Membuat draft transaksi dari keranjang.
     * Termasuk menghitung total berat dan ongkir di backend berdasarkan data dari database dan request.
     */
    public function createDraft(Request $request): JsonResponse
    {
        // Ambil user yang sedang login
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        // Ambil cart milik user
        $cart = Cart::with('items.buku')->where('user_id', $user->id)->first();

        if (!$cart || $cart->items->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Keranjang kosong.'
            ], 400);
        }

        // Validasi request data yang diperlukan
        $request->validate([
            'alamat_pengiriman' => 'required|string',
            'kurir' => 'required|string', // Kode kurir (jne, tiki, dll)
            'origin_district_id' => 'required|integer|min:1', // ID kecamatan gudang
            'destination_district_id' => 'required|integer|min:1', // ID kecamatan tujuan
        ]);

        $now = Carbon::now('Asia/Jakarta');

        // --- HITUNG TOTAL HARGA BARANG DAN TOTAL BERAT DARI CART_ITEMS (MENGGUNAKAN MODEL DB) ---
        $totalHargaBarang = 0;
        $totalBerat = 0;

        foreach ($cart->items as $item) {
            $buku = $item->buku; // Relasi 'buku' diambil via with('items.buku')

            // Validasi stok
            if ($buku->stok < $item->jumlah) {
                return response()->json(['success' => false, 'message' => "Stok buku {$buku->judul} tidak cukup."], 422);
            }

            // --- HITUNG BERAT (MENGGUNAKAN MODEL BUKU) ---
            $beratPerItem = $buku->berat ?? 500; // Gunakan nilai default jika kolom 'berat' NULL
            $totalBerat += $beratPerItem * $item->jumlah;

            // --- HITUNG HARGA (MENGGUNAKAN MODEL BUKU DAN PROMO) ---
            $hargaSatuan = $buku->harga;

            // Cek promo aktif untuk buku ini
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

            if ($activePromo) {
                $promoBook = $activePromo->books()->where('promo_buku.buku_id', $buku->buku_id)->first();
                if ($promoBook && $promoBook->pivot) {
                    $discountPercent = $promoBook->pivot->discount_percent;
                    if (is_numeric($discountPercent) && $discountPercent > 0) {
                        $hargaSatuan = $buku->harga - ($buku->harga * $discountPercent / 100);
                    }
                }
            }

            $totalHargaBarang += $hargaSatuan * $item->jumlah;
        }
        // --- END HITUNG HARGA & BERAT (MENGGUNAKAN MODEL DB) ---

        // --- HITUNG ONGKIR MENGGUNAKAN API RAJAONGKIR (MENGGUNAKAN DATA DARI REQUEST DAN BERAT DARI DB) ---
        $ongkir = $this->calculateShippingCost(
            $request->origin_district_id,
            $request->destination_district_id,
            $totalBerat, // Gunakan total berat yang dihitung dari cart_items di database
            $request->kurir
        );

        if ($ongkir === null) {
            return response()->json(['success' => false, 'message' => 'Gagal menghitung ongkir dari API.'], 500);
        }
        // --- END HITUNG ONGKIR (MENGGUNAKAN MODEL DB & REQUEST) ---

        $totalAkhir = $totalHargaBarang + $ongkir;

        // --- SIMPAN TRANSAKSI KE DATABASE (MENGGUNAKAN MODEL TRANSAKSI) ---
        $transaksi = Transaksi::create([
            'user_id' => $user->id,
            'total_harga' => $totalAkhir, // Total harga barang + ongkir
            'total_berat' => $totalBerat, // Total berat dari cart_items di database
            'alamat_pengiriman' => $request->alamat_pengiriman,
            'kurir' => $request->kurir,
            'ongkir' => $ongkir, // Simpan nilai ongkir yang dihitung ke database
            'status_transaksi' => 'pesanan-disiapkan', // Set status awal
            'destination_district_id' => $request->destination_district_id, // Simpan ID tujuan
            // 'origin_district_id' => $request->origin_district_id, // Opsional: simpan ID asal
        ]);
        // --- END SIMPAN TRANSAKSI (MENGGUNAKAN MODEL TRANSAKSI) ---

        // --- SIMPAN DETAIL TRANSAKSI KE DATABASE (MENGGUNAKAN MODEL TRANSAKSIDETAIL) ---
        foreach ($cart->items as $item) {
            $buku = $item->buku;

            // Cek promo aktif untuk detail ini (sama seperti di atas)
            $hargaSatuan = $buku->harga;
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

            if ($activePromo) {
                $promoBook = $activePromo->books()->where('promo_buku.buku_id', $buku->buku_id)->first();
                if ($promoBook && $promoBook->pivot) {
                    $discountPercent = $promoBook->pivot->discount_percent;
                    if (is_numeric($discountPercent) && $discountPercent > 0) {
                        $hargaSatuan = $buku->harga - ($buku->harga * $discountPercent / 100);
                    }
                }
            }

            // Buat record di transaksi_details
            TransaksiDetail::create([
                'transaksi_id' => $transaksi->transaksi_id, // Foreign key ke transaksi
                'buku_id' => $item->buku_id, // Foreign key ke buku
                'jumlah' => $item->jumlah,
                'harga_satuan' => $hargaSatuan,
            ]);
        }
        // --- END SIMPAN DETAIL TRANSAKSI (MENGGUNAKAN MODEL TRANSAKSIDETAIL) ---

        // --- HAPUS ITEM DI KERANJANG SETELAH CHECKOUT (MENGGUNAKAN MODEL CARTITEM) ---
        CartItem::where('cart_id', $cart->id)->delete();
        // --- END HAPUS KERANJANG (MENGGUNAKAN MODEL CARTITEM) ---

        return response()->json([
            'success' => true,
            'message' => 'Draft transaksi berhasil dibuat.',
            'data' => ['transaksi' => $transaksi],
        ], 201);
    }

    // --- METHOD TAMBAHAN UNTUK MENGHITUNG ONGKIR VIA API (MENGGUNAKAN HTTP CLIENT) ---
    private function calculateShippingCost(int $originId, int $destinationId, int $weight, string $courier): ?int
    {
        $apiKey = env('RAJAONGKIR_API_KEY');
        if (!$apiKey) {
            Log::error('RAJAONGKIR_API_KEY tidak ditemukan di .env');
            return null;
        }

        // Validasi kurir yang didukung
        $allowedCouriers = ['jne', 'tiki', 'pos', 'sicepat', 'jnt'];
        if (!in_array($courier, $allowedCouriers)) {
            Log::warning("Kurir tidak valid: {$courier}");
            return null;
        }

        try {
            $response = Http::withHeaders([
                    'Content-Type' => 'application/x-www-form-urlencoded',
                    'key' => $apiKey, // Gunakan header 'key' sesuai dokumentasi komerce.id
                ])
                ->post('https://rajaongkir.komerce.id/api/v1/calculate/district/domestic-cost', [ // Gunakan endpoint yang benar
                    'origin_district_id' => $originId,
                    'destination_district_id' => $destinationId,
                    'weight' => $weight,
                    'courier' => $courier,
                    'price' => 'lowest', // Tambahkan parameter jika diperlukan
                ]);

            if (!$response->successful()) {
                Log::warning('Rajaongkir API cost error: ' . $response->body());
                return null;
            }

            $data = $response->json();
            $costs = $data['data'] ?? [];

            if (empty($costs)) {
                Log::warning('Rajaongkir API cost: Tidak ada hasil biaya.');
                return null;
            }

            // Ambil hasil pertama (asumsi hanya satu kurir yang dipanggil)
            $costDetail = $costs[0]['cost'][0] ?? null;
            if (!$costDetail) {
                Log::warning('Rajaongkir API cost: Struktur respons tidak valid.');
                return null;
            }

            // Ambil nilai biaya
            return (int) ($costDetail['value'] ?? $costDetail['cost'] ?? 0);

        } catch (\Exception $e) {
            Log::error('Rajaongkir calculateShippingCost exception: ' . $e->getMessage());
            return null;
        }
    }
    // --- END METHOD calculateShippingCost ---
}