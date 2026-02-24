<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Buku;
use App\Models\Promo;
use App\Models\Category;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Http;

class BookController extends Controller
{
    public function index()
    {
        $now = Carbon::now('Asia/Jakarta');

        $books = Buku::with(['admin', 'categories'])->get()->map(function ($book) use ($now) {
            $promoInfo = null;

            if ($book->harga === null || $book->harga <= 0) {
                return $this->formatBookResponse($book, $promoInfo);
            }

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
                        $hargaDiskon = $book->harga - ($book->harga * $discountPercent / 100);
                        $promoInfo = [
                            'nama_promo' => $activePromo->name,
                            'diskon_persen' => (int) $discountPercent,
                            'harga_setelah_diskon' => (int) $hargaDiskon,
                        ];
                    }
                }
            }

            return $this->formatBookResponse($book, $promoInfo);
        });

        return response()->json($books);
    }

    private function formatBookResponse($book, $promoInfo)
    {
        return [
            'buku_id' => $book->buku_id,
            'judul' => $book->judul,
            'penulis' => $book->penulis,
            'penerbit' => $book->penerbit,
            'stok' => $book->stok,
            'kondisi' => $book->kondisi,
            'foto' => $book->foto,
            'deskripsi' => $book->deskripsi,
            
            'category' => $book->categories->pluck('slug')->filter()->join(','),
            'category_labels' => $book->categories->pluck('name')->filter()->values(),
            
            'harga' => (int) $book->harga,
            'berat' => $book->berat,
            'isbn' => $book->isbn,
            'tahun' => $book->tahun,
            'admin_id' => $book->admin_id,
            'created_at' => $book->created_at,
            'updated_at' => $book->updated_at,
            'promo_info' => $promoInfo,
        ];
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'judul' => 'required|string|max:255',
            'penulis' => 'required|string|max:255',
            'penerbit' => 'required|string|max:255',
            'stok' => 'required|integer|min:0',
            'kondisi' => ['required', Rule::in(['baru', 'baik', 'cukup', 'rusak', 'minus'])],
            'deskripsi' => 'nullable|string',
            'kategori' => 'required|array',
            'kategori.*' => 'exists:categories,category_id',
            'harga' => 'required|numeric|min:1000',
            'berat' => 'nullable|numeric|min:1',
            'isbn' => 'nullable|string|max:20',
            'tahun' => 'required|integer|min:1900|max:' . date('Y'),
            'admin_id' => 'required|exists:admin,admin_id',
            'foto' => 'nullable|url|max:500',
        ]);

        if (!empty($validated['foto'])) {
            $cloudName = env('CLOUDINARY_CLOUD_NAME');
            if (!str_starts_with($validated['foto'], "https://res.cloudinary.com/{$cloudName}/")) {
                return response()->json([
                    'message' => 'Foto harus berasal dari Cloudinary yang sah.',
                    'errors' => ['foto' => ['URL tidak valid.']]
                ], 422);
            }
        }

        $kategoriIds = $validated['kategori'];
        unset($validated['kategori']);

        $buku = Buku::create($validated);
        $buku->categories()->attach($kategoriIds);
        $buku->load('categories');

        return response()->json($this->formatBookResponse($buku, null), 201);
    }

    public function show($id)
    {
        $buku = Buku::with(['admin', 'categories'])->findOrFail($id);
        return response()->json($this->formatBookResponse($buku, null));
    }

    public function update(Request $request, $id)
    {
        $buku = Buku::findOrFail($id);

        $validated = $request->validate([
            'judul' => 'sometimes|required|string|max:255',
            'penulis' => 'sometimes|required|string|max:255',
            'penerbit' => 'sometimes|required|string|max:255',
            'stok' => 'sometimes|required|integer|min:0',
            'kondisi' => ['sometimes', 'required', Rule::in(['baru', 'baik', 'cukup', 'rusak', 'minus'])],
            'deskripsi' => 'nullable|string',
            'kategori' => 'required|array',
            'kategori.*' => 'exists:categories,category_id',
            'harga' => 'sometimes|required|numeric|min:1000',
            'berat' => 'nullable|numeric|min:1',
            'isbn' => 'nullable|string|max:20',
            'tahun' => 'sometimes|required|integer|min:1900|max:' . date('Y'),
            'admin_id' => 'sometimes|required|exists:admin,admin_id',
            'foto' => 'nullable|url|max:500',
        ]);

        if (isset($validated['foto']) && !empty($validated['foto'])) {
            $cloudName = env('CLOUDINARY_CLOUD_NAME');
            if (!str_starts_with($validated['foto'], "https://res.cloudinary.com/{$cloudName}/")) {
                return response()->json([
                    'message' => 'Foto harus berasal dari Cloudinary yang sah.',
                    'errors' => ['foto' => ['URL tidak valid.']]
                ], 422);
            }
        }

        $kategoriIds = $validated['kategori'];
        unset($validated['kategori']);

        $buku->update($validated);
        $buku->categories()->sync($kategoriIds);
        $buku->load('categories');

        return response()->json($this->formatBookResponse($buku, null));
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:buku,buku_id',
        ]);

        $ids = $request->ids;
        $fotoUrls = Buku::whereIn('buku_id', $ids)->pluck('foto')->filter()->toArray();

        Buku::whereIn('buku_id', $ids)->each(function ($buku) {
            $buku->categories()->detach();
        });

        Buku::destroy($ids);

        foreach ($fotoUrls as $url) {
            if (str_starts_with($url, 'https://res.cloudinary.com/')) {
                $this->deleteFromCloudinaryByUrl($url);
            }
        }

        return response()->json([
            'message' => 'Buku berhasil dihapus.',
            'deleted_count' => count($ids)
        ]);
    }

    public function destroy($id)
    {
        $buku = Buku::findOrFail($id);

        if ($buku->foto && str_starts_with($buku->foto, 'https://res.cloudinary.com/')) {
            $this->deleteFromCloudinaryByUrl($buku->foto);
        }

        $buku->categories()->detach();
        $buku->delete();

        return response()->json(null, 204);
    }

    private function deleteFromCloudinaryByUrl($url)
    {
        try {
            $path = parse_url($url, PHP_URL_PATH);
            $parts = explode('/', $path);
            $uploadIndex = array_search('upload', $parts);
            
            if ($uploadIndex !== false && isset($parts[$uploadIndex + 1])) {
                $publicId = implode('/', array_slice($parts, $uploadIndex + 2));
                $publicId = preg_replace('/\.[^.]*$/', '', $publicId);

                $cloudName = env('CLOUDINARY_CLOUD_NAME');
                $apiKey = env('CLOUDINARY_API_KEY');
                $apiSecret = env('CLOUDINARY_API_SECRET');
                $timestamp = time();
                $signature = sha1("public_id={$publicId}&timestamp={$timestamp}{$apiSecret}");

                $response = Http::asForm()->post("https://api.cloudinary.com/v1_1/{$cloudName}/image/destroy", [
                    'public_id' => $publicId,
                    'signature' => $signature,
                    'api_key' => $apiKey,
                    'timestamp' => $timestamp,
                ]);

                Log::info('Cloudinary delete attempt', [
                    'url' => $url,
                    'public_id' => $publicId,
                    'success' => $response->successful(),
                    'response' => $response->json()
                ]);

                return $response->successful();
            }
        } catch (\Exception $e) {
            Log::error('Cloudinary delete failed: ' . $e->getMessage(), ['url' => $url]);
        }
        return false;
    }

    public function cleanupImage(Request $request)
    {
        $request->validate(['foto_url' => 'required|url|max:500']);
        $this->deleteFromCloudinaryByUrl($request->foto_url);
        return response()->json(['success' => true]);
    }
}