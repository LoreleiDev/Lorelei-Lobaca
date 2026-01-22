<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaksi;
use Illuminate\Http\Request;

class TransactionStatusController extends Controller
{
    public function show($orderId)
    {
        $user = auth()->user();

        $transaksi = Transaksi::where('transaction_id_midtrans', $orderId)
            ->where('user_id', $user->id)
            ->first();

        if (!$transaksi) {
            return response()->json(['error' => 'Transaksi tidak ditemukan'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'order_id' => $transaksi->transaction_id_midtrans,
                'status_transaksi' => $transaksi->status_transaksi,
                'admin_action_status' => $transaksi->admin_action_status,
            ]
        ]);
    }
}