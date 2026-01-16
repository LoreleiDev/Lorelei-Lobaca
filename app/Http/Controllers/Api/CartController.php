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
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $cart = $user->cart()->with('items.buku')->first();
        if (!$cart) {
            $cart = $user->cart()->create();
        }

        $items = $cart->items->map(function ($item) {
            $buku = $item->buku;

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
            $discountPrice = (int) $buku->harga;
            $hasPromo = false;
            $promoName = null;

            if ($activePromo) {
                $promoBook = $activePromo->books()->where('promo_buku.buku_id', $buku->buku_id)->first();
                if ($promoBook && $promoBook->pivot) {
                    $discountPercent = $promoBook->pivot->discount_percent;
                    if (is_numeric($discountPercent) && $discountPercent > 0) {
                        $discountPrice = $buku->harga - ($buku->harga * $discountPercent / 100);
                        $hasPromo = true;
                        $promoName = $activePromo->name;
                    }
                }
            }

            return [
                'cart_item_id' => $item->cart_item_id,
                'jumlah' => $item->jumlah,
                'buku' => [
                    'id' => $buku->buku_id,
                    'buku_id' => $buku->buku_id,
                    'judul' => $buku->judul,
                    'penulis' => $buku->penulis,
                    'harga' => $buku->harga,
                    'foto' => $buku->foto,
                    'kategori' => $buku->kategori,
                    'berat' => $buku->berat,
                    'stok' => $buku->stok,
                    'discount_percent' => (int) $discountPercent,
                    'originalPrice' => (int) $buku->harga,
                    'discountPrice' => $discountPrice,
                    'has_promo' => $hasPromo,
                    'promo_name' => $promoName,
                    'slug' => str($buku->judul)->slug()->toString(),
                    'rating' => (float) $buku->average_rating,
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

    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'buku_id' => 'required|exists:buku,buku_id',
            'jumlah' => 'required|integer|min:1',
        ]);

        $buku = Buku::findOrFail($validated['buku_id']);

        $cart = $user->cart()->firstOrCreate([]);

        $existingItem = $cart->items()->where('buku_id', $validated['buku_id'])->first();

        if ($existingItem) {
            $existingItem->increment('jumlah', $validated['jumlah']);
        } else {
            $cart->items()->create($validated);
        }

        return response()->json([
            'success' => true,
            'message' => 'Item berhasil ditambahkan ke keranjang.',
            'data' => $cart->fresh()->load('items.buku'),
        ], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $cartItem = CartItem::with('cart.user', 'buku')->findOrFail($id);

        $this->authorizeItem($cartItem);

        $validated = $request->validate([
            'jumlah' => 'required|integer|min:1',
        ]);

        $cartItem->update(['jumlah' => $validated['jumlah']]);

        return response()->json([
            'success' => true,
            'message' => 'Item keranjang berhasil diperbarui.',
            'data' => $cartItem->fresh()->load('buku'),
        ], 200);
    }

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