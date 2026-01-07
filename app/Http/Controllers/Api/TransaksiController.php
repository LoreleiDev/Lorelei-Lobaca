<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaksi;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class TransaksiController extends Controller
{
    /**
     * Display a listing of transactions for the authenticated user.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function indexForUser(): JsonResponse
    {
        $user = Auth::user();
        $transaksi = $user->transaksi()->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $transaksi
        ], 200);
    }

    /**
     * Display a listing of all transactions (Admin only).
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function indexForAdmin(): JsonResponse
    {
        
        $transaksi = Transaksi::with('user')->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $transaksi
        ], 200);
    }

    /**
     * Display the specified transaction.
     *
     * @param  \App\Models\Transaksi  $transaksi
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Transaksi $transaksi): JsonResponse
    {
        $user = Auth::user();

        
        if ($transaksi->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.'
            ], 403);
        }

        
        $transaksi->load('transaksiDetails.buku');

        return response()->json([
            'success' => true,
            'data' => [
                'transaksi' => $transaksi,
            ]
        ], 200);
    }

    /**
     * Update transaction status to 'pesanan-sedang-dikirim' (Admin only).
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Transaksi  $transaksi
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateToShipped(Request $request, Transaksi $transaksi): JsonResponse
    {
        
        $request->validate([
            'resi_pengiriman' => 'required|string',
        ]);

        
        if ($transaksi->status_transaksi !== 'transaksi-sukses') {
            return response()->json([
                'success' => false,
                'message' => 'Status transaksi harus "transaksi-sukses" sebelum dikirim.' 
            ], 400);
        }

        $transaksi->update([
            'status_transaksi' => 'pesanan-sedang-dikirim', 
            'resi_pengiriman' => $request->resi_pengiriman,
            'tanggal_dikirim' => now(), 
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status transaksi berhasil diperbarui ke "pesanan-sedang-dikirim".', 
            'data' => $transaksi
        ], 200);
    }

    /**
     * Confirm transaction as 'pesanan-telah-diterima' by the user.
     *
     * @param  \App\Models\Transaksi  $transaksi
     * @return \Illuminate\Http\JsonResponse
     */
    public function confirmReceived(Transaksi $transaksi): JsonResponse
    {
        $user = Auth::user();

        
        if ($transaksi->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.'
            ], 403);
        }

        
        if ($transaksi->status_transaksi !== 'pesanan-sedang-dikirim') { 
            return response()->json([
                'success' => false,
                'message' => 'Status transaksi harus "pesanan-sedang-dikirim" sebelum bisa dikonfirmasi diterima.', 
            ], 400);
        }

        $transaksi->update([
            'status_transaksi' => 'pesanan-telah-diterima', 
            'tanggal_diterima' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status transaksi berhasil dikonfirmasi sebagai "pesanan-telah-diterima".', 
            'data' => $transaksi
        ], 200);
    }
}