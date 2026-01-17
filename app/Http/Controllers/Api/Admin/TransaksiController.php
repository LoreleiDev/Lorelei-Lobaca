<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaksi;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TransaksiController extends Controller
{
    public function approve(Request $request, $id)
    {
        $admin = $request->user('admin');

        $transaksi = Transaksi::findOrFail($id);

        if ($transaksi->admin_action_status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi sudah diproses.'
            ], 400);
        }

        DB::beginTransaction();

        try {

            $transaksi->update([
                'admin_action_status' => 'approved',
                'admin_id_proses' => $admin->admin_id,
            ]);


            if ($transaksi->status_transaksi === 'transaksi-diproses') {
                $transaksi->update(['status_transaksi' => 'transaksi-sukses']);

                $this->reduceStock($transaksi->transaksi_id);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil disetujui.',
                'data' => $transaksi
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Approve Transaction Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyetujui transaksi.'
            ], 500);
        }
    }

    public function reject(Request $request, $id)
    {
        $admin = $request->user('admin');

        $transaksi = Transaksi::findOrFail($id);

        if ($transaksi->admin_action_status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi sudah diproses.'
            ], 400);
        }

        DB::beginTransaction();

        try {

            $transaksi->update([
                'admin_action_status' => 'rejected',
                'admin_id_proses' => $admin->admin_id,
            ]);


            $transaksi->update(['status_transaksi' => 'transaksi-dibatalkan']);


            $this->restoreStock($transaksi->transaksi_id);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil ditolak.',
                'data' => $transaksi
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Reject Transaction Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menolak transaksi.'
            ], 500);
        }
    }

    private function reduceStock($transaksiId)
    {
        $details = \App\Models\TransaksiDetail::where('transaksi_id', $transaksiId)->get();
        foreach ($details as $detail) {
            if ($detail->buku_id) {
                $buku = \App\Models\Buku::find($detail->buku_id);
                if ($buku) {
                    $buku->decrement('stok', $detail->jumlah);
                }
            }
        }
    }

    private function restoreStock($transaksiId)
    {
        $details = \App\Models\TransaksiDetail::where('transaksi_id', $transaksiId)->get();
        foreach ($details as $detail) {
            if ($detail->buku_id) {
                $buku = \App\Models\Buku::find($detail->buku_id);
                if ($buku) {
                    $buku->increment('stok', $detail->jumlah);
                }
            }
        }
    }
}