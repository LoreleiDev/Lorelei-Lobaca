<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaksi;
use Illuminate\Http\Request;

class TransaksiController extends Controller
{
    public function index()
    {
        $transaksi = Transaksi::with(['user', 'buku'])->latest()->get();
        return response()->json($transaksi);
    }

    public function updateToShipped(Transaksi $transaksi)
    {
        $transaksi->update(['status' => 'dikirim']);
        return response()->json($transaksi);
    }
}