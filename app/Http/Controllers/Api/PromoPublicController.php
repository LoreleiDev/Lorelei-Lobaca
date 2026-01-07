<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Promo;
use Carbon\Carbon;

class PromoPublicController extends Controller
{
    public function active()
    {
        $now = Carbon::now('Asia/Jakarta');
        $activePromos = Promo::with('books')
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
                ];
            });

        return response()->json($activePromos);
    }

    public function featured()
    {
        $now = Carbon::now('Asia/Jakarta');
        $featured = Promo::with('books')
            ->whereRaw("CONCAT(start_date, ' ', COALESCE(start_time, '00:00:00')) <= ?", [$now->format('Y-m-d H:i:s')])
            ->whereRaw("CONCAT(end_date, ' ', COALESCE(end_time, '23:59:59')) >= ?", [$now->format('Y-m-d H:i:s')])
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$featured) {
            return response()->json(null);
        }

        return response()->json([
            'id' => $featured->id,
            'name' => $featured->name,
            'imageUrl' => $featured->image_url,
            'booksCount' => $featured->books->count(),
        ]);
    }

    public function show($id)
{
    $promo = Promo::with('books')->find($id);

    if (!$promo) {
        return response()->json(['message' => 'Promo tidak ditemukan'], 404);
    }

    return response()->json([
        'id' => $promo->id,
        'name' => $promo->name,
        'startDate' => $promo->start_date?->toDateString(),
        'endDate' => $promo->end_date?->toDateString(),
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
    ]);
}
}