<?php

namespace App\Http\Controllers\Api;

use App\Models\Wishlist;
use App\Models\Buku;
use App\Models\Promo;
use Carbon\Carbon;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;

class WishlistController extends Controller
{
    public function index()
    {
        $wishlists = Auth::user()->wishlist()->with('buku.admin', 'buku.reviews')->get();
        $now = Carbon::now('Asia/Jakarta');

        $books = $wishlists->map(function ($item) use ($now) {
            $book = $item->buku;

            $hasPromo = false;
            $discountPrice = (int) $book->harga;
            $promoName = null;
            $discountPercent = null;

            $activePromo = Promo::whereHas('books', function ($q) use ($book) {
                $q->where('promo_buku.buku_id', $book->buku_id);
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
                $promoBook = $activePromo->books()->where('promo_buku.buku_id', $book->buku_id)->first();
                if ($promoBook && $promoBook->pivot) {
                    $discountPercent = $promoBook->pivot->discount_percent;
                    if (is_numeric($discountPercent) && $discountPercent > 0) {
                        $discountPrice = $book->harga - ($book->harga * $discountPercent / 100);
                        $hasPromo = true;
                        $promoName = $activePromo->name;
                    }
                }
            }

            return [
                'id' => $book->buku_id,
                'title' => $book->judul,
                'author' => $book->penulis,
                'image' => $book->foto,
                'originalPrice' => (int) $book->harga,
                'discountPrice' => (int) $discountPrice,
                'discountPercent' => $discountPercent,
                'rating' => (float) $book->average_rating,
                'slug' => str($book->judul)->slug()->toString(),
                'has_promo' => $hasPromo,
                'promo_name' => $promoName,
                'category' => $book->kategori,
            ];
        });

        return response()->json($books);
    }

    public function store(Request $request)
    {
        $request->validate([
            'buku_id' => 'required|exists:buku,buku_id'
        ]);

        $exists = Wishlist::where('user_id', Auth::id())
            ->where('buku_id', $request->buku_id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Sudah ada di wishlist'], 200);
        }

        Wishlist::create([
            'user_id' => Auth::id(),
            'buku_id' => $request->buku_id
        ]);

        return response()->json(['message' => 'Ditambahkan ke wishlist'], 201);
    }

    public function destroy($buku_id)
    {
        Wishlist::where('user_id', Auth::id())
            ->where('buku_id', $buku_id)
            ->delete();

        return response()->json(['message' => 'Dihapus dari wishlist'], 200);
    }
}