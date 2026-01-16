<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\PasswordController;
use App\Http\Controllers\Api\EmailController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\WishlistController;
use App\Http\Controllers\Api\TransaksiController;
use App\Http\Controllers\Api\Admin\BookController;
use App\Http\Controllers\Api\BookPublicController;
use App\Http\Controllers\Api\RajaongkirController;
use App\Http\Controllers\Api\Admin\PromoController;
use App\Http\Controllers\Api\PromoPublicController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| These routes are stateless and do NOT use CSRF protection.
|
*/

// --- Routes Public ---
Route::post('/register', [AuthController::class, 'apiRegister']);
Route::post('/login', [AuthController::class, 'apiLogin']);
Route::post('/logout', [AuthController::class, 'logout']);
Route::post('/password/send-code', [PasswordController::class, 'sendResetCode']);
Route::post('/password/verify-code', [PasswordController::class, 'verifyResetCode']);
Route::post('/password/reset', [PasswordController::class, 'resetPasswordViaCode']);

Route::get('/books/recommended', [BookPublicController::class, 'recommended']);
Route::get('/books', [BookPublicController::class, 'getBooksByIds']);
Route::get('/promos/active', [PromoPublicController::class, 'active']);
Route::get('/promos/featured', [PromoPublicController::class, 'featured']);
Route::get('/promos/{id}', [PromoPublicController::class, 'show']);
Route::get('/search/books', [BookPublicController::class, 'search']);
Route::get('/book/{id}', [BookPublicController::class, 'showById']);
Route::get('/books/{bookId}/reviews', [ReviewController::class, 'index']);
Route::get('/testimonials/public', [ReviewController::class, 'getTestimonialsForPublic']);

// --- Routes Email Change ---
Route::middleware('auth:api')->prefix('email')->group(function () {
    Route::post('/send-code-current', [EmailController::class, 'sendCodeToCurrentEmail']);
    Route::post('/verify-current', [EmailController::class, 'verifyCurrentEmailCode']);
    Route::post('/send-code-new', [EmailController::class, 'sendCodeToNewEmail']);
    Route::post('/verify-new', [EmailController::class, 'verifyNewEmailCode']);
});

// --- Routes Public ---
Route::middleware('auth:sanctum')->group(function () {
    // --- Profil ---
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar']);
    Route::put('/profile', [ProfileController::class, 'updateProfile']);
    // --- Cart ---
    Route::apiResource('/cart', CartController::class)->only(['index', 'store', 'update', 'destroy']);
    // --- Wishlist ---
    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist', [WishlistController::class, 'store']);
    Route::delete('/wishlist/{buku_id}', [WishlistController::class, 'destroy']);
    // --- Reviews ---
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::put('/reviews/{id}', [ReviewController::class, 'update']);
    Route::get('/books/{bookId}/reviews', [ReviewController::class, 'index']);
    // Checkout 
    Route::post('/checkout/process-payment', [CheckoutController::class, 'processPayment']);
    // Transaksi 
    Route::get('/rajaongkir/provinces', [RajaongkirController::class, 'getProvinces']);
    Route::get('/rajaongkir/cities/{provinceId}', [RajaongkirController::class, 'getCities']);
    Route::get('/rajaongkir/districts/{cityId}', [RajaongkirController::class, 'getDistricts']);
    Route::get('/rajaongkir/sub-districts/{districtId}', [RajaongkirController::class, 'getSubDistricts']);

    Route::get('/transaksi/{id}', [TransaksiController::class, 'show'])->name('transaksi.show');
    Route::get('/transaksi/user', [TransaksiController::class, 'indexForUser'])->name('transaksi.user.index');
    Route::put('/transaksi/{transaksi}/diterima', [TransaksiController::class, 'confirmReceived'])->name('transaksi.confirm_received');
});

// --- Checkout Routes ---
Route::post('/checkout/notification', [CheckoutController::class, 'receiveNotification']);

// --- Rajaongkir Routes ---
Route::post('/rajaongkir/calculate-shipping', [RajaongkirController::class, 'calculateShipping']);

// --- Routes Admin ---
Route::middleware('api')->prefix('admin')->group(function () {
    Route::post('/login', [\App\Http\Controllers\Api\Admin\AuthController::class, 'login']);
});

Route::middleware(['api', 'auth:sanctum,admin', 'admin'])->prefix('admin')->group(function () {
    Route::get('/me', [\App\Http\Controllers\Api\Admin\AuthController::class, 'me']);
    Route::post('/logout', [\App\Http\Controllers\Api\Admin\AuthController::class, 'logout']);
    Route::delete('/books/bulk', [BookController::class, 'bulkDestroy']);
    Route::apiResource('books', BookController::class);
    Route::post('/books/cleanup-image', [BookController::class, 'cleanupImage']);
    Route::apiResource('promos', PromoController::class);
    Route::post('/promos/cleanup-image', [PromoController::class, 'cleanupImage']);
    Route::get('/ulasan/books', [App\Http\Controllers\Api\Admin\ReviewController::class, 'indexBooks']);
    Route::get('/ulasan/book/{bookId}', [App\Http\Controllers\Api\Admin\ReviewController::class, 'showReviewsByBook']);
    Route::post('/ulasan/{reviewId}/to-testimonial', [App\Http\Controllers\Api\Admin\ReviewController::class, 'convertToTestimonial']);
    Route::delete('/ulasan/{reviewId}/remove-testimonial', [App\Http\Controllers\Api\Admin\ReviewController::class, 'removeAsTestimonial']);
    Route::get('/transaksi', [\App\Http\Controllers\Api\Admin\TransaksiController::class, 'index']);
    Route::put('/transaksi/{transaksi}/kirim', [\App\Http\Controllers\Api\Admin\TransaksiController::class, 'updateToShipped']);
});