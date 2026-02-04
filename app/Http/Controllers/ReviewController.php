<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Buku;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    /**
     * Store a new review or update existing one
     */
    public function store(Request $request): JsonResponse
    {
        if (!Auth::check()) {
            return response()->json(['message' => 'Anda harus login untuk memberikan ulasan'], 401);
        }
        
        $request->validate([
            'book_id' => 'required|exists:buku,buku_id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|max:1000',
        ]);

        $review = Review::updateOrCreate(
            [
                'book_id' => $request->book_id,
                'user_id' => Auth::id(),
            ],
            [
                'rating' => $request->rating,
                'comment' => $request->comment,
            ]
        );

        return response()->json(['message' => 'Ulasan berhasil disimpan', 'review' => $review], 201);
    }

    /**
     * Update an existing review
     */
    public function update(Request $request, $id): JsonResponse
    {
        if (!Auth::check()) {
            return response()->json(['message' => 'Anda harus login untuk mengedit ulasan'], 401);
        }
        
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|max:1000',
        ]);

        $review = Review::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$review) {
            return response()->json([
                'message' => 'Ulasan tidak ditemukan atau Anda tidak memiliki izin untuk mengeditnya.'
            ], 403);
        }

        $review->update([
            'rating' => $request->rating,
            'comment' => $request->comment,
        ]);

        return response()->json(['message' => 'Ulasan berhasil diperbarui', 'review' => $review], 200);
    }

    /**
     * Get all reviews for a book - PUBLIC (tanpa auth)
     */
    public function index($bookId): JsonResponse
    {
        $reviews = Review::with('user:id,first_name,last_name,avatar')
            ->where('book_id', $bookId)
            ->latest()
            ->get();

        // Tandai review mana yang milik user yang sedang login (jika ada)
        $reviews = $reviews->map(function ($review) {
            $review->is_user_review = Auth::check() && $review->user_id === auth()->id();
            return $review;
        });

        return response()->json(['reviews' => $reviews]);
    }

    /**
     * Get book rating statistics
     */
    public function getBookRating($bookId): JsonResponse
    {
        $book = Buku::find($bookId);

        if (!$book) {
            return response()->json(['message' => 'Buku tidak ditemukan'], 404);
        }

        $totalReviews = Review::where('book_id', $bookId)->count();

        if ($totalReviews === 0) {
            $averageRating = 0;
        } else {
            $averageRating = Review::where('book_id', $bookId)->avg('rating');
            $averageRating = round($averageRating, 1);
        }

        return response()->json([
            'book_id' => $bookId,
            'average_rating' => $averageRating,
            'total_reviews' => $totalReviews,
        ]);
    }

    /**
     * Get testimonials for public display
     */
    public function getTestimonialsForPublic(): JsonResponse
    {
        $testimonials = Review::with('user:id,first_name,last_name,avatar')
            ->where('is_testimonial', true)
            ->latest()
            ->get(['id', 'comment', 'rating', 'created_at', 'user_id', 'book_id']);

        return response()->json(['testimonials' => $testimonials]);
    }
}