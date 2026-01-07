<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Buku;
use App\Models\Promo;
use Carbon\Carbon;
use Illuminate\Http\Request;

class BookPublicController extends Controller
{
    public function recommended(Request $request)
    {
        $now = Carbon::now('Asia/Jakarta');
        $type = $request->query('type', 'all');
        $limit = $request->query('limit', 10);
        $unlimited = $request->query('unlimited', false);

        if ($type !== 'promo') {
            $query = Buku::with('admin', 'reviews')
                ->where('harga', '>', 0)
                ->where('stok', '>', 0);

            if ($type === 'non_promo') {
                $query->whereDoesntHave('promo', function ($q) use ($now) {
                    $q->where(function ($sub) use ($now) {
                        $sub->where('start_date', '<', $now->toDateString())
                            ->orWhere(function ($s) use ($now) {
                                $s->where('start_date', '=', $now->toDateString())
                                    ->where('start_time', '<=', $now->format('H:i'));
                            });
                    })
                        ->where(function ($sub) use ($now) {
                            $sub->where('end_date', '>', $now->toDateString())
                                ->orWhere(function ($s) use ($now) {
                                    $s->where('end_date', '=', $now->toDateString())
                                        ->where('end_time', '>', $now->format('H:i'));
                                });
                        });
                });
            }

            if (!$unlimited) {
                $query->limit($limit);
            }

            $books = $query->inRandomOrder()->get();
            return response()->json($this->formatBooks($books, $now));
        }

        $activePromos = Promo::where(function ($q) use ($now) {
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
            ->orderBy('start_date', 'desc')
            ->limit(10)
            ->get();

        $resultBooks = [];
        foreach ($activePromos as $promo) {
            $booksInPromo = $promo->books()
                ->where('buku.harga', '>', 0)
                ->where('buku.stok', '>', 0)
                ->with(['admin', 'reviews'])
                ->limit(5)
                ->get();

            foreach ($booksInPromo as $book) {
                $discountPercent = $book->pivot->discount_percent;
                $hargaDiskon = $book->harga;

                if (is_numeric($discountPercent) && $discountPercent > 0) {
                    $hargaDiskon = $book->harga - ($book->harga * $discountPercent / 100);
                }

                $resultBooks[] = [
                    'id' => $book->buku_id,
                    'title' => $book->judul,
                    'author' => $book->penulis,
                    'image' => $book->foto,
                    'originalPrice' => (int) $book->harga,
                    'discountPrice' => (int) $hargaDiskon,
                    'discountPercent' => $discountPercent,
                    'rating' => (float) $book->average_rating,
                    'slug' => str($book->judul)->slug()->toString(),
                    'has_promo' => true,
                    'promo_id' => $promo->id,
                    'promo_name' => $promo->name,
                    'category' => $book->kategori,
                ];

                if (!$unlimited && count($resultBooks) >= $limit) {
                    break 2;
                }
            }
        }

        return response()->json($resultBooks);
    }

    public function search(Request $request)
    {
        $searchTerm = trim($request->query('q', ''));
        $categories = $request->query('category', []);
        $now = Carbon::now('Asia/Jakarta');

        if (strlen($searchTerm) < 1 && empty($categories)) {
            return response()->json([]);
        }

        $query = Buku::with(['admin', 'reviews'])
            ->where('harga', '>', 0)
            ->where('stok', '>', 0);

        if (!empty($categories)) {
            if (!is_array($categories)) {
                $categories = [$categories];
            }

            $categories = array_map('trim', $categories);
            $categories = array_filter($categories);
            $categories = array_unique($categories);

            if (!empty($categories)) {
                $query->where(function ($q) use ($categories) {
                    foreach ($categories as $cat) {
                        $q->orWhere('kategori', 'ILIKE', "%{$cat}%");
                    }
                });
            }
        }

        if (strlen($searchTerm) >= 1) {
            $searchTerm = strtolower($searchTerm);
            $query->where(function ($q) use ($searchTerm) {
                $q->whereRaw('LOWER(judul) ILIKE ?', ["%{$searchTerm}%"])
                    ->orWhereRaw('LOWER(penulis) ILIKE ?', ["%{$searchTerm}%"])
                    ->orWhereRaw('LOWER(penerbit) ILIKE ?', ["%{$searchTerm}%"])
                    ->orWhereRaw('LOWER(kategori) ILIKE ?', ["%{$searchTerm}%"]);
            });
        }

        $books = $query->get();
        return response()->json($this->formatBooks($books, $now));
    }

    public function showById($id)
    {
        $book = Buku::with('admin', 'reviews')->find($id);

        if (!$book || $book->harga <= 0 || $book->stok <= 0) {
            return response()->json(['message' => 'Buku tidak ditemukan'], 404);
        }

        $now = Carbon::now('Asia/Jakarta');
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

        return response()->json([
            'id' => $book->buku_id,
            'title' => $book->judul,
            'author' => $book->penulis,
            'image' => $book->foto,
            'penerbit' => $book->penerbit,
            'tahun' => $book->tahun,
            'isbn' => $book->isbn,
            'stok' => $book->stok,
            'berat' => $book->berat,
            'kondisi' => $book->kondisi,
            'originalPrice' => (int) $book->harga,
            'discountPrice' => (int) $discountPrice,
            'discountPercent' => $discountPercent,
            'rating' => (float) $book->average_rating,
            'deskripsi' => $book->deskripsi,
            'kategori' => $book->kategori,
            'has_promo' => $hasPromo,
            'promo_name' => $promoName,
            'slug' => str($book->judul)->slug()->toString(),
        ]);
    }

    public function getBooksByIds(Request $request)
    {
        $ids = $request->query('ids', []);
        if (empty($ids)) {
            return response()->json([]);
        }

        $ids = array_filter(array_map('intval', $ids), fn($id) => $id > 0);
        if (empty($ids)) {
            return response()->json([]);
        }

        $now = Carbon::now('Asia/Jakarta');

        $books = Buku::with(['admin', 'reviews'])
            ->whereIn('buku_id', $ids)
            ->select('buku_id', 'judul', 'penulis', 'harga', 'foto', 'kategori')
            ->get()
            ->map(function ($book) use ($now) {
                
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

                $discountPercent = null;
                $discountPrice = (int) $book->harga;

                if ($activePromo) {
                    $promoBook = $activePromo->books()->where('promo_buku.buku_id', $book->buku_id)->first();
                    if ($promoBook && $promoBook->pivot) {
                        $discountPercent = $promoBook->pivot->discount_percent;
                        if (is_numeric($discountPercent) && $discountPercent > 0) {
                            $discountPrice = $book->harga - ($book->harga * $discountPercent / 100);
                        }
                    }
                }
                return [
                    'id' => $book->buku_id,
                    'title' => $book->judul,
                    'author' => $book->penulis,
                    'originalPrice' => (int) $book->harga,
                    'discountPrice' => (int) $discountPrice,
                    'discountPercent' => $discountPercent, 
                    'image' => $book->foto,
                    'slug' => str($book->judul)->slug()->toString(),
                    'category' => $book->kategori,
                    'rating' => (float) $book->average_rating,
                ];
            });

        return response()->json($books);
    }
    private function formatBooks($books, $now)
    {
        return $books->map(function ($book) use ($now) {
            $hasPromo = false;
            $discountPrice = (int) $book->harga;
            $promoName = null;

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
                'discountPercent' => $activePromo ? $discountPercent : null,
                'rating' => (float) $book->average_rating,
                'slug' => str($book->judul)->slug()->toString(),
                'has_promo' => $hasPromo,
                'promo_name' => $promoName,
                'category' => $book->kategori,
            ];
        });
    }
}