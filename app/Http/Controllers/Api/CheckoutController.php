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
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class CheckoutController extends Controller
{
    public function processPayment(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            Log::error('Checkout Error: User not authenticated');
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $cart = Cart::with([
            'items.buku' => function ($query) {
                $query->withAvg('reviews', 'rating');
            }
        ])->where('user_id', $user->id)->first();

        if (!$cart || $cart->items->isEmpty()) {
            Log::error('Checkout Error: Cart is empty for user ID: ' . $user->id);
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

        $allowedMethods = ['gopay', 'dana', 'ovo'];
        $frontendPaymentMethod = $request->input('payment_method');
        if (!in_array($frontendPaymentMethod, $allowedMethods)) {
            Log::error('Checkout Error: Disallowed payment method: ' . $frontendPaymentMethod);
            return response()->json([
                'success' => false,
                'message' => 'Metode pembayaran tidak didukung.'
            ], 400);
        }

        $now = Carbon::now('Asia/Jakarta');

        $totalHargaBarang = 0;
        $totalBerat = 0;
        $itemDetailsForMidtrans = [];

        foreach ($cart->items as $item) {
            $buku = $item->buku;

            if ($buku->stok < $item->jumlah) {
                Log::error('Checkout Error: Insufficient stock for book "' . $buku->judul . '". Available: ' . $buku->stok . ', Requested: ' . $item->jumlah);
                return response()->json([
                    'success' => false,
                    'message' => "Stok buku '{$buku->judul}' tidak mencukupi. Tersedia: {$buku->stok}, Diminta: {$item->jumlah}."
                ], 422);
            }

            $beratPerItem = $buku->berat ?? 500;
            $totalBerat += $beratPerItem * $item->jumlah;

            $hargaSatuan = $buku->harga;
            $discountPercent = 0;

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

            $subtotalItem = $hargaSatuan * $item->jumlah;
            $totalHargaBarang += $subtotalItem;

            $itemDetailsForMidtrans[] = [
                'id' => $buku->buku_id,
                'price' => (int) $hargaSatuan,
                'quantity' => $item->jumlah,
                'name' => $buku->judul,
            ];
        }

        $ongkir = $request->ongkir;
        $totalAkhir = $totalHargaBarang + $ongkir;

        if ($ongkir > 0) {
            $itemDetailsForMidtrans[] = [
                'id' => 'shipping_fee',
                'price' => (int) $ongkir,
                'quantity' => 1,
                'name' => 'Ongkos Kirim (' . $request->kurir . ')',
            ];
        }

        $orderId = 'LOBACA-' . time() . '-' . $user->id;

        Log::info('Payment Method from Request:', ['method' => $frontendPaymentMethod]);

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

        $payload = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => $totalAkhir,
            ],
            'customer_details' => $customerDetails,
            'item_details' => $itemDetailsForMidtrans,
        ];

        $payload['customer_details']['shipping_address'] = $shippingAddress;

        switch ($frontendPaymentMethod) {
            case 'gopay':
                $payload['payment_type'] = 'gopay';
                break;

            case 'dana':
            case 'ovo':
                $payload['payment_type'] = 'qris';
                break;

            default:
                Log::error('Unexpected payment method after validation: ' . $frontendPaymentMethod);
                return response()->json([
                    'success' => false,
                    'message' => 'Metode pembayaran tidak valid.'
                ], 400);
        }

        $serverKey = env('MIDTRANS_SERVER_KEY');
        if (!$serverKey) {
            Log::error('MIDTRANS_SERVER_KEY tidak ditemukan di .env');
            return response()->json(['success' => false, 'message' => 'Konfigurasi pembayaran tidak ditemukan.'], 500);
        }

        $encodedServerKey = base64_encode($serverKey . ':');

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
            'refund' => 'transaksi-ditolak',
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
            'admin_action_status' => 'pending',
            'transaction_id_midtrans' => $orderId,
            'midtrans_response' => json_encode($midtransResponse),
            'payment_method' => $frontendPaymentMethod,
        ]);

        foreach ($cart->items as $item) {
            $buku = $item->buku;

            $hargaSatuanFinal = $buku->harga;
            $discountPercentFinal = 0;

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

        // Kosongkan cart
        CartItem::where('cart_id', $cart->cart_id)->delete();
        $cart->delete();
        Log::info('Cart cleared after successful checkout', ['user_id' => $user->id]);

        // Kirim email ke admin
        $admins = Admin::all();
        foreach ($admins as $admin) {
            try {
                Mail::to($admin->email)->send(new NewTransactionMail($transaksi));
                Log::info('Email notification sent to: ' . $admin->email);
            } catch (\Exception $e) {
                Log::error('Failed to send email to ' . $admin->email . ': ' . $e->getMessage());
            }
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
            Log::error('Webhook Error: Invalid JSON payload');
            return response('Bad Request', 400);
        }

        $orderId = $notification->order_id;
        $transactionStatus = $notification->transaction_status;
        $fraudStatus = $notification->fraud_status ?? 'accept';

        Log::info('Webhook Received - Order ID: ' . $orderId . ', Status: ' . $transactionStatus);

        $transaksi = Transaksi::where('transaction_id_midtrans', $orderId)->first();

        if (!$transaksi) {
            Log::warning('Webhook Error: Transaksi tidak ditemukan untuk order_id: ' . $orderId);
            return response('Order ID not found', 404);
        }

        $statusMapping = [
            'pending' => 'transaksi-diproses',
            'settlement' => 'transaksi-sukses',
            'capture' => 'transaksi-sukses',
            'cancel' => 'transaksi-dibatalkan',
            'expire' => 'transaksi-kadaluarsa',
            'deny' => 'transaksi-ditolak',
            'refund' => 'transaksi-ditolak',
        ];

        $mappedStatus = $statusMapping[$transactionStatus] ?? 'transaksi-diproses';

        $transaksi->update(['status_transaksi' => $mappedStatus]);

        Log::info('Webhook Processed - Order ID: ' . $orderId . ' updated to status: ' . $mappedStatus);
        return response('Notification received', 200);
    }
}