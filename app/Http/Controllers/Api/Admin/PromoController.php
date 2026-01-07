<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Promo;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Http;

class PromoController extends Controller
{
    protected function cleanupExpiredPromos()
    {
        $now = Carbon::now('Asia/Jakarta');
        $expiredPromos = Promo::whereNotNull('end_date')
            ->whereRaw("CONCAT(end_date, ' ', COALESCE(end_time, '23:59:59')) < ?", [
                $now->format('Y-m-d H:i:s')
            ])
            ->get();

        foreach ($expiredPromos as $promo) {
            if ($promo->image_url) {
                $this->deleteFromCloudinaryByUrl($promo->image_url);
            }
            $promo->books()->detach();
            $promo->delete();
        }
    }

    public function index()
    {
        $this->cleanupExpiredPromos();
        $now = Carbon::now('Asia/Jakarta');

        $promos = Promo::with('books')
            ->whereRaw("CONCAT(start_date, ' ', COALESCE(start_time, '00:00:00')) <= ?", [$now->format('Y-m-d H:i:s')])
            ->whereRaw("CONCAT(end_date, ' ', COALESCE(end_time, '23:59:59')) >= ?", [$now->format('Y-m-d H:i:s')])
            ->get()
            ->map(function ($promo) {
                return [
                    'id' => $promo->id,
                    'name' => $promo->name,
                    'startDate' => $promo->start_date->toDateString(),
                    'endDate' => $promo->end_date->toDateString(),
                    'startTime' => $promo->start_time,
                    'endTime' => $promo->end_time,
                    'imageUrl' => $promo->image_url,
                    'books' => $promo->books->map(function ($book) {
                        return [
                            'id' => $book->buku_id,
                            'title' => $book->judul,
                            'author' => $book->penulis,
                            'discount' => $book->pivot->discount_percent,
                        ];
                    }),
                    'createdAt' => $promo->created_at->toISOString(),
                ];
            });

        return response()->json($promos);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'startDate' => 'required|date',
            'endDate' => 'required|date|after_or_equal:startDate',
            'startTime' => 'required|date_format:H:i',
            'endTime' => 'required|date_format:H:i',
            'image_url' => 'required|url|max:500',
            'books' => 'nullable|array',
            'books.*.id' => 'nullable|exists:buku,buku_id',
            'books.*.discount' => 'required_with:books|integer|min:1|max:100',
        ]);

        $cloudName = 'dvwp7mgic';
        if (!str_starts_with($validated['image_url'], "https://res.cloudinary.com/{$cloudName}/")) {
            return response()->json([
                'message' => 'Gambar promo harus berasal dari Cloudinary yang sah.',
                'errors' => ['image_url' => ['URL tidak valid.']]
            ], 422);
        }

        $now = Carbon::now('Asia/Jakarta');

        if (!empty($validated['books'])) {
            $bookIds = collect($validated['books'])->pluck('id')->unique()->values()->all();
            $existingPromo = Promo::whereHas('books', function ($q) use ($bookIds) {
                $q->whereIn('promo_buku.buku_id', $bookIds);
            })->whereRaw("CONCAT(end_date, ' ', COALESCE(end_time, '23:59:59')) >= ?", [
                        $now->format('Y-m-d H:i:s')
                    ])->exists();

            if ($existingPromo) {
                return response()->json([
                    'message' => 'Salah satu buku sudah dipakai di promo aktif lain.'
                ], 422);
            }
        }

        $promo = Promo::create([
            'name' => $validated['name'],
            'start_date' => $validated['startDate'],
            'end_date' => $validated['endDate'],
            'start_time' => $validated['startTime'],
            'end_time' => $validated['endTime'],
            'image_url' => $validated['image_url'],
        ]);

        if (!empty($validated['books'])) {
            foreach ($validated['books'] as $book) {
                $promo->books()->attach($book['id'], [
                    'discount_percent' => $book['discount']
                ]);
            }
        }

        return response()->json($promo->fresh()->load('books'), 201);
    }

    public function update(Request $request, $id)
    {
        try {
            $promo = Promo::findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'startDate' => 'sometimes|required|date',
                'endDate' => 'sometimes|required|date|after_or_equal:startDate',
                'startTime' => 'sometimes|required|date_format:H:i',
                'endTime' => 'sometimes|required|date_format:H:i',
                'image_url' => 'required|url|max:500',
                'books' => 'nullable|array',
                'books.*.id' => 'nullable|exists:buku,buku_id',
                'books.*.discount' => 'required_with:books|integer|min:1|max:100',
            ]);

            $cloudName = 'dvwp7mgic';
            if (!str_starts_with($validated['image_url'], "https://res.cloudinary.com/{$cloudName}/")) {
                return response()->json([
                    'message' => 'Gambar promo harus berasal dari Cloudinary yang sah.',
                    'errors' => ['image_url' => ['URL tidak valid.']]
                ], 422);
            }

            $now = Carbon::now('Asia/Jakarta');

            if (!empty($validated['books'])) {
                $bookIds = collect($validated['books'])->pluck('id')->unique()->values()->all();
                $existingPromo = Promo::where('id', '!=', $id)
                    ->whereHas('books', function ($q) use ($bookIds) {
                        $q->whereIn('promo_buku.buku_id', $bookIds);
                    })
                    ->whereRaw("CONCAT(end_date, ' ', COALESCE(end_time, '23:59:59')) >= ?", [
                        $now->format('Y-m-d H:i:s')
                    ])
                    ->exists();

                if ($existingPromo) {
                    return response()->json([
                        'message' => 'Salah satu buku sudah dipakai di promo aktif lain.'
                    ], 422);
                }
            }

            $oldImageUrl = $promo->image_url;

            $promo->update([
                'name' => $validated['name'] ?? $promo->name,
                'start_date' => $validated['startDate'] ?? $promo->start_date,
                'end_date' => $validated['endDate'] ?? $promo->end_date,
                'start_time' => $validated['startTime'] ?? $promo->start_time,
                'end_time' => $validated['endTime'] ?? $promo->end_time,
                'image_url' => $validated['image_url'],
            ]);

            if (!empty($validated['books'])) {
                $promo->books()->detach();
                foreach ($validated['books'] as $book) {
                    $promo->books()->attach($book['id'], [
                        'discount_percent' => $book['discount']
                    ]);
                }
            } else {
                $promo->books()->detach();
            }

            if ($oldImageUrl && $oldImageUrl !== $promo->image_url) {
                $this->deleteFromCloudinaryByUrl($oldImageUrl);
            }

            return response()->json($promo->fresh()->load('books'));
        } catch (\Exception $e) {
            Log::error('Update Promo Error', [
                'promo_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['message' => 'Gagal memperbarui promo.'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $promo = Promo::findOrFail($id);
            if ($promo->image_url) {
                $this->deleteFromCloudinaryByUrl($promo->image_url);
            }
            $promo->books()->detach();
            $promo->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Delete Promo Error', ['promo_id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Gagal menghapus promo.'], 500);
        }
    }

    public function show($id)
    {
        $promo = Promo::with('books')->findOrFail($id);
        return response()->json([
            'id' => $promo->id,
            'name' => $promo->name,
            'startDate' => $promo->start_date->toDateString(),
            'endDate' => $promo->end_date->toDateString(),
            'startTime' => $promo->start_time,
            'endTime' => $promo->end_time,
            'imageUrl' => $promo->image_url,
            'books' => $promo->books->map(function ($book) {
                return [
                    'id' => $book->buku_id,
                    'title' => $book->judul,
                    'author' => $book->penulis,
                    'discount' => $book->pivot->discount_percent,
                ];
            }),
            'createdAt' => $promo->created_at->toISOString(),
        ]);
    }

    public function cleanupImage(Request $request)
    {
        $request->validate(['foto_url' => 'required|url|max:500']);
        $this->deleteFromCloudinaryByUrl($request->foto_url);
        return response()->json(['success' => true]);
    }

    private function deleteFromCloudinaryByUrl($url)
    {
        if (!preg_match('/^https:\/\/res\.cloudinary\.com\/dvwp7mgic\//', $url)) {
            Log::warning('URL bukan dari Cloudinary Lobaca:', ['url' => $url]);
            return false;
        }

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
}