<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Buku;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReviewController extends Controller
{
    public function indexBooks(): JsonResponse
    {

        $bookIdsWithReviews = Review::select('book_id')
            ->distinct()
            ->pluck('book_id');


        $books = Buku::whereIn('buku_id', $bookIdsWithReviews)
            ->get(['buku_id', 'judul', 'foto']);


        $books = $books->map(function ($book) {
            $book->reviews_count = Review::where('book_id', $book->buku_id)->count();
            return $book;
        });

        return response()->json(['books' => $books]);
    }

    public function showReviewsByBook($bookId): JsonResponse
    {
        $book = Buku::with('reviews.user:id,first_name,last_name,avatar')->findOrFail($bookId);

        $reviews = $book->reviews->map(function ($review) {
            $review->is_already_testimonial = $review->is_testimonial;
            return $review;
        });

        return response()->json([
            'book' => ['id' => $book->buku_id, 'title' => $book->judul],
            'reviews' => $reviews,
        ]);
    }

    public function convertToTestimonial($reviewId): JsonResponse
    {
        $review = Review::findOrFail($reviewId);

        $review->update(['is_testimonial' => true]);

        return response()->json(['message' => 'Ulasan berhasil dijadikan testimonial.', 'review' => $review], 200);
    }

    public function removeAsTestimonial($reviewId): JsonResponse
    {
        $review = Review::findOrFail($reviewId);

        $review->update(['is_testimonial' => false]);

        return response()->json(['message' => 'Status testimonial berhasil dihapus.', 'review' => $review], 200);
    }
}