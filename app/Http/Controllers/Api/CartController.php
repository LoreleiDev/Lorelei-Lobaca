<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\Buku;
use App\Models\Promo;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class CartController extends Controller
{
    /**
     * Tampilkan isi keranjang user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user(); // atau Auth::user();

        $cart = $user->cart()->with('items.buku')->first();

        // Jika user belum punya cart, buatkan
        if (!$cart) {
            $cart = $user->cart()->create();
        }

        // Ambil items, dan tambahkan logika diskon
        $items = $cart->items->map(function ($item) {
            $buku = $item->buku;

            // Cek apakah buku ini punya promo aktif
            $now = Carbon::now('Asia/Jakarta');
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

            $discountPercent = 0;
            if ($activePromo) {
                $promoBook = $activePromo->books()->where('promo_buku.buku_id', $buku->buku_id)->first();
                if ($promoBook && $promoBook->pivot) {
                    $discountPercent = $promoBook->pivot->discount_percent;
                }
            }

            return [
                'cart_item_id' => $item->cart_item_id,
                'jumlah' => $item->jumlah,
                'buku' => [
                    'buku_id' => $buku->buku_id,
                    'judul' => $buku->judul,
                    'penulis' => $buku->penulis,
                    'harga' => $buku->harga,
                    'foto' => $buku->foto,
                    'kategori' => $buku->kategori,
                    'berat' => $buku->berat,
                    'stok' => $buku->stok,
                    'discount_percent' => (int) $discountPercent,
                ]
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $items,
                'cart_id' => $cart->cart_id,
            ],
        ], 200);
    }

    /**
     * Tambah item ke keranjang.
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'buku_id' => 'required|exists:buku,buku_id',
            'jumlah' => 'required|integer|min:1',
        ]);

        $buku = Buku::findOrFail($validated['buku_id']);

        if ($buku->stok < $validated['jumlah']) {
            return response()->json([
                'success' => false,
                'message' => 'Stok buku tidak mencukupi.',
            ], 422);
        }

        // Ambil atau buat cart user
        $cart = $user->cart()->firstOrCreate([]);

        // Cek apakah buku sudah ada di cart
        $existingItem = $cart->items()->where('buku_id', $validated['buku_id'])->first();

        if ($existingItem) {
            $newJumlah = $existingItem->jumlah + $validated['jumlah'];

            if ($buku->stok < $newJumlah) {
                return response()->json([
                    'success' => false,
                    'message' => 'Stok buku tidak mencukupi setelah penambahan.',
                ], 422);
            }

            $existingItem->update(['jumlah' => $newJumlah]);
        } else {
            $cart->items()->create($validated);
        }

        return response()->json([
            'success' => true,
            'message' => 'Item berhasil ditambahkan ke keranjang.',
            'data' => $cart->fresh()->load('items.buku'),
        ], 201);
    }

    /**
     * Update jumlah item di keranjang.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $cartItem = CartItem::with('cart.user', 'buku')->findOrFail($id);

        $this->authorizeItem($cartItem);

        $validated = $request->validate([
            'jumlah' => 'required|integer|min:1',
        ]);

        $buku = $cartItem->buku;

        if ($buku->stok < $validated['jumlah']) {
            return response()->json([
                'success' => false,
                'message' => 'Stok buku tidak mencukupi.',
            ], 422);
        }

        $cartItem->update(['jumlah' => $validated['jumlah']]);

        return response()->json([
            'success' => true,
            'message' => 'Item keranjang berhasil diperbarui.',
            'data' => $cartItem->fresh()->load('buku'),
        ], 200);
    }

    /**
     * Hapus item dari keranjang.
     */
    public function destroy($id): JsonResponse
    {
        $cartItem = CartItem::with('cart.user')->findOrFail($id);

        $this->authorizeItem($cartItem);
        $cartItem->delete();

        return response()->json([
            'success' => true,
            'message' => 'Item berhasil dihapus dari keranjang.',
        ], 200);
    }

    /**
     * Kosongkan seluruh isi keranjang.
     */
    public function clear(): JsonResponse
    {
        $user = Auth::user();
        $cart = $user->cart;

        if ($cart) {
            $cart->items()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Keranjang berhasil dikosongkan.',
        ], 200);
    }

    /**
     * Cek kepemilikan item.
     */
    private function authorizeItem(CartItem $item)
    {
        if ($item->cart->user_id !== Auth::id()) {
            abort(response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403));
        }
    }
}