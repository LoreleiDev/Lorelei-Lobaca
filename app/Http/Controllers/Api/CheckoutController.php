<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\NewTransactionMail;
use App\Models\Admin;
use App\Models\Buku;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Promo;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class CheckoutController extends Controller
{
    public function processPayment(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $cart = Cart::with(['items.buku' => function ($query) {
            $query->withAvg('reviews', 'rating');
        }])->where('user_id', $user->id)->first();

        if (!$cart || $cart->items->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Keranjang kosong.'
            ], 400);
        }

        $request->validate([
            'alamat_pengiriman' => 'required|string',
            'kurir' => 'required|string',
            'ongkir' => 'required|integer|min:0',
            'destination_district_id' => 'required|integer|min:1',
        ]);

        $now = Carbon::now('Asia/Jakarta');

        $totalHargaBarang = 0;
        $totalBerat = 0;
        $itemDetailsForMidtrans = [];

        foreach ($cart->items as $item) {
            $buku = $item->buku;

            if ($buku->stok < $item->jumlah) {
                return response()->json([
                    'success' => false,
                    'message' => "Stok buku '{$buku->judul}' tidak mencukupi. Tersedia: {$buku->stok}, Diminta: {$item->jumlah}."
                ], 422);
            }

            $beratPerItem = $buku->berat ?? 500;
            $totalBerat += $beratPerItem * $item->jumlah;

            $hargaSatuan = $buku->harga;
            $discountPercent = 0;
            $hasPromo = false;
            $promoName = null;

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
                        $hasPromo = true;
                        $promoName = $activePromo->name;
                    }
                }
            }

            $subtotalItem = $hargaSatuan * $item->jumlah;
            $totalHargaBarang += $subtotalItem;

            $itemDetailsForMidtrans[] = [
                'id' => $buku->buku_id,
                'price' => (int)$hargaSatuan,
                'quantity' => $item->jumlah,
                'name' => $buku->judul,
            ];
        }

        $ongkir = $request->ongkir;
        $totalAkhir = $totalHargaBarang + $ongkir;

        if ($ongkir > 0) {
            $itemDetailsForMidtrans[] = [
                'id' => 'shipping_fee',
                'price' => (int)$ongkir,
                'quantity' => 1,
                'name' => 'Ongkos Kirim (' . $request->kurir . ')',
            ];
        }

        $orderId = 'LOBACA-' . time() . '-' . $user->id;

        $frontendPaymentMethod = $request->input('payment_method');

        $frontendToMidtrans = [
            'bank_transfer' => 'bank_transfer',
            'bca_transfer' => 'bank_transfer',
            'bni_transfer' => 'bank_transfer',
            'bri_transfer' => 'bank_transfer',
            'mandiri_transfer' => 'bank_transfer',
            'permata_transfer' => 'bank_transfer',
            'credit_card' => 'credit_card',
            'gopay' => 'gopay',
            'shopeepay' => 'shopeepay',
            'dana' => 'qris',
            'ovo' => 'qris',
        ];

        $midtransPaymentType = $frontendToMidtrans[$frontendPaymentMethod] ?? null;

        if (!$midtransPaymentType) {
            return response()->json([
                'success' => false,
                'message' => 'Metode pembayaran tidak didukung.'
            ], 400);
        }

        $customerDetails = [
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'phone' => $user->phone ?? '',
            'billing_address' => [
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone' => $user->phone ?? '',
                'address' => $request->alamat_pengiriman,
                'country_code' => 'IDN',
            ],
        ];

        $shippingAddress = [
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'phone' => $user->phone ?? '',
            'address' => $request->alamat_pengiriman,
            'country_code' => 'IDN',
        ];

        Log::info('Checkout Debug - User Data:', [
            'user_id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'phone' => $user->phone,
        ]);

        Log::info('Checkout Debug - Request Data:', [
            'alamat_pengiriman' => $request->alamat_pengiriman,
            'kurir' => $request->kurir,
            'ongkir' => $request->ongkir,
            'payment_method' => $frontendPaymentMethod,
        ]);

        Log::info('Checkout Debug - Customer Details for Midtrans:', $customerDetails);
        Log::info('Checkout Debug - Shipping Address for Midtrans:', $shippingAddress);
        Log::info('Checkout Debug - Item Details for Midtrans:', $itemDetailsForMidtrans);

        $payload = [
            'payment_type' => $midtransPaymentType,
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => $totalAkhir,
            ],
            'customer_details' => $customerDetails,
            'item_details' => $itemDetailsForMidtrans,
        ];

        $payload['customer_details']['shipping_address'] = $shippingAddress;

        $bankMapping = [
            'bca_transfer' => 'bca',
            'bni_transfer' => 'bni',
            'bri_transfer' => 'bri',
            'mandiri_transfer' => 'mandiri',
            'permata_transfer' => 'permata',
        ];

        $targetBank = $bankMapping[$frontendPaymentMethod] ?? null;

        switch ($frontendPaymentMethod) {
            case 'bca_transfer':
            case 'bni_transfer':
            case 'bri_transfer':
            case 'mandiri_transfer':
            case 'permata_transfer':
                $payload['bank_transfer'] = [
                    'bank' => $targetBank
                ];
                break;
            case 'gopay':
                break;
            case 'shopeepay':
                break;
            case 'dana':
            case 'ovo':
                break;
        }

        $serverKey = env('MIDTRANS_SERVER_KEY');
        if (!$serverKey) {
            Log::error('MIDTRANS_SERVER_KEY tidak ditemukan di .env');
            return response()->json(['success' => false, 'message' => 'Konfigurasi pembayaran tidak ditemukan.'], 500);
        }

        $encodedServerKey = base64_encode($serverKey . ':');

        Log::info('Checkout Debug - Final Payload to Midtrans:', $payload);

        try {
            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'Authorization' => 'Basic ' . $encodedServerKey,
                'Content-Type' => 'application/json',
            ])->post('https://api.sandbox.midtrans.com/v2/charge', $payload);

            if (!$response->successful()) {
                Log::error('Midtrans Charge Error: ' . $response->body());
                $responseData = $response->json();
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal menginisiasi pembayaran.',
                    'error' => $responseData['message'] ?? 'Unknown error',
                    'raw_error' => $response->body()
                ], $response->status());
            }

            $midtransResponse = $response->json();
            $midtransTransactionId = $midtransResponse['transaction_id'] ?? null;

            if (!$midtransTransactionId) {
                Log::error('Midtrans Charge Success tetapi tidak mengembalikan transaction_id: ' . $response->body());
                return response()->json([
                    'success' => false,
                    'message' => 'Respon pembayaran tidak valid.',
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Midtrans Charge Exception: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Kesalahan jaringan saat menghubungi Midtrans.',
                'error' => $e->getMessage()
            ], 500);
        }

        $statusMapping = [
            'pending' => 'transaksi-diproses',
            'settlement' => 'transaksi-sukses',
            'capture' => 'transaksi-sukses',
            'cancel' => 'transaksi-dibatalkan',
            'expire' => 'transaksi-kadaluarsa',
            'deny' => 'transaksi-ditolak',
        ];

        $midtransStatus = $midtransResponse['transaction_status'] ?? 'pending';
        $mappedStatus = $statusMapping[$midtransStatus] ?? 'transaksi-diproses';

        $transaksi = Transaksi::create([
            'user_id' => $user->id,
            'total_harga' => $totalAkhir,
            'total_berat' => $totalBerat,
            'alamat_pengiriman' => $request->alamat_pengiriman,
            'kurir' => $request->kurir,
            'ongkir' => $ongkir,
            'status_transaksi' => $mappedStatus,
            'transaction_id_midtrans' => $midtransTransactionId,
            'midtrans_response' => json_encode($midtransResponse),
        ]);

        foreach ($cart->items as $item) {
            $buku = $item->buku;

            $hargaSatuanFinal = $buku->harga;
            $discountPercentFinal = 0;
            $hasPromoFinal = false;
            $promoNameFinal = null;

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
                    $discountPercentFinal = $promoBook->pivot->discount_percent;
                    if (is_numeric($discountPercentFinal) && $discountPercentFinal > 0) {
                        $hargaSatuanFinal = $buku->harga - ($buku->harga * $discountPercentFinal / 100);
                        $hasPromoFinal = true;
                        $promoNameFinal = $activePromo->name;
                    }
                }
            }

            TransaksiDetail::create([
                'transaksi_id' => $transaksi->transaksi_id,
                'buku_id' => $item->buku_id,
                'jumlah' => $item->jumlah,
                'harga_satuan' => $hargaSatuanFinal,
            ]);
        }

        // Kirim notifikasi ke admin
        $admins = Admin::all();
        foreach ($admins as $admin) {
            Mail::to($admin->email)->send(new NewTransactionMail($transaksi));
        }

        return response()->json([
            'success' => true,
            'message' => 'Transaksi pembayaran berhasil dibuat.',
            'data' => $midtransResponse,
        ], 201);
    }

    public function receiveNotification(Request $request)
    {
        $notificationJson = $request->getContent();
        $notification = json_decode($notificationJson);

        if (!$notification) {
            return response('Bad Request', 400);
        }

        $orderId = $notification->order_id;
        $transactionStatus = $notification->transaction_status;
        $fraudStatus = $notification->fraud_status ?? 'accept';

        $transaksi = Transaksi::where('transaction_id_midtrans', $orderId)->first();

        if (!$transaksi) {
            Log::warning('Transaksi tidak ditemukan untuk order_id: ' . $orderId);
            return response('Order ID not found', 404);
        }

        $statusMapping = [
            'pending' => 'transaksi-diproses',
            'settlement' => 'transaksi-sukses',
            'capture' => 'transaksi-sukses',
            'cancel' => 'transaksi-dibatalkan',
            'expire' => 'transaksi-kadaluarsa',
            'deny' => 'transaksi-ditolak',
        ];

        $mappedStatus = $statusMapping[$transactionStatus] ?? 'transaksi-diproses';

        switch ($transactionStatus) {
            case 'capture':
            case 'settlement':
                if ($fraudStatus === 'challenge' || $fraudStatus === 'accept') {
                    $transaksi->update(['status_transaksi' => $mappedStatus]);

                    if ($fraudStatus === 'accept') {
                        $this->reduceStock($transaksi->transaksi_id);
                    }
                }
                break;
            case 'cancel':
            case 'expire':
            case 'deny':
                $transaksi->update(['status_transaksi' => $mappedStatus]);
                break;
            case 'pending':
                $transaksi->update(['status_transaksi' => $mappedStatus]);
                break;
        }

        return response('Notification received', 200);
    }

    private function reduceStock($transaksiId)
    {
        $details = TransaksiDetail::where('transaksi_id', $transaksiId)->get();
        foreach ($details as $detail) {
            if ($detail->buku_id) {
                $buku = Buku::find($detail->buku_id);
                if ($buku) {
                    $buku->decrement('stok', $detail->jumlah);
                }
            }
        }
    }
}