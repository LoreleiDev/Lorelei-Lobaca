<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function getStats(Request $request)
    {
        $timeRange = $request->query('time_range', 'monthly');


        $revenueChart = $this->getRevenueChartData($timeRange);


        $statusChart = $this->getStatusDistribution();

        return response()->json([
            'success' => true,
            'revenue_chart' => $revenueChart,
            'status_chart' => $statusChart
        ]);
    }

    private function getRevenueChartData($timeRange)
    {
        $query = Transaksi::whereIn('admin_action_status', ['approved', 'shipped']);

        switch ($timeRange) {
            case 'yearly':
                $data = $query->select(
                    DB::raw('EXTRACT(MONTH FROM created_at)::integer as month_num'),
                    DB::raw("TO_CHAR(created_at, 'Mon') as month"),
                    DB::raw('SUM(total_harga) as revenue'),
                    DB::raw('SUM((SELECT SUM(jumlah) FROM transaksi_detail WHERE transaksi_id = transaksi.transaksi_id)) as books')
                )
                    ->whereYear('created_at', now()->year)
                    ->groupBy('month_num', 'month')
                    ->orderBy('month_num')
                    ->get()
                    ->map(function ($item) {
                        return [
                            'month' => $item->month,
                            'revenue' => (float) $item->revenue,
                            'books' => (int) $item->books
                        ];
                    });
                break;

            case 'monthly':
                $data = $query->select(
                    DB::raw('EXTRACT(DAY FROM created_at)::integer as day'),
                    DB::raw('SUM(total_harga) as revenue'),
                    DB::raw('SUM((SELECT SUM(jumlah) FROM transaksi_detail WHERE transaksi_id = transaksi.transaksi_id)) as books')
                )
                    ->whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->groupBy('day')
                    ->orderBy('day')
                    ->get()
                    ->map(function ($item) {
                        return [
                            'day' => (int) $item->day,
                            'revenue' => (float) $item->revenue,
                            'books' => (int) $item->books
                        ];
                    });
                break;

            case 'weekly':
                $data = $query->select(
                    DB::raw("TO_CHAR(created_at, 'Day') as day_name"),
                    DB::raw('EXTRACT(DAY FROM created_at)::integer as day'),
                    DB::raw('SUM(total_harga) as revenue'),
                    DB::raw('SUM((SELECT SUM(jumlah) FROM transaksi_detail WHERE transaksi_id = transaksi.transaksi_id)) as books')
                )
                    ->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])
                    ->groupBy('day_name', 'day')
                    ->orderBy('day')
                    ->get()
                    ->map(function ($item) {

                        $dayName = trim($item->day_name);
                        return [
                            'day_name' => $dayName,
                            'day' => (int) $item->day,
                            'revenue' => (float) $item->revenue,
                            'books' => (int) $item->books
                        ];
                    });
                break;

            case 'daily':
            default:
                $data = $query->select(
                    DB::raw('EXTRACT(HOUR FROM created_at)::integer as hour'),
                    DB::raw('SUM(total_harga) as revenue'),
                    DB::raw('SUM((SELECT SUM(jumlah) FROM transaksi_detail WHERE transaksi_id = transaksi.transaksi_id)) as books')
                )
                    ->whereDate('created_at', today())
                    ->groupBy('hour')
                    ->orderBy('hour')
                    ->get()
                    ->map(function ($item) {
                        return [
                            'hour' => (int) $item->hour,
                            'revenue' => (float) $item->revenue,
                            'books' => (int) $item->books
                        ];
                    });
        }

        return $data;
    }

    private function getStatusDistribution()
    {
        $pendingCount = Transaksi::where('admin_action_status', 'pending')
            ->whereIn('status_transaksi', ['transaksi-diproses', 'transaksi-sukses'])
            ->count();

        $approvedCount = Transaksi::where('admin_action_status', 'approved')
            ->where('status_transaksi', 'transaksi-sukses')
            ->count();

        $shippedCount = Transaksi::where('admin_action_status', 'shipped')
            ->where('status_transaksi', 'pesanan-sedang-dikirim')
            ->count();

        $rejectedCount = Transaksi::where('admin_action_status', 'rejected')
            ->where('status_transaksi', 'transaksi-ditolak')
            ->count();

        $expiredCount = Transaksi::where('status_transaksi', 'transaksi-kadaluarsa')
            ->count();

        $statuses = [
            ['name' => 'Pending', 'value' => $pendingCount, 'color' => '#FFD700'],
            ['name' => 'Approved', 'value' => $approvedCount, 'color' => '#10B981'],
            ['name' => 'Shipped', 'value' => $shippedCount, 'color' => '#3B82F6'],
            ['name' => 'Rejected', 'value' => $rejectedCount, 'color' => '#EF4444'],
            ['name' => 'Expired', 'value' => $expiredCount, 'color' => '#F97316']
        ];

        $filtered = array_filter($statuses, fn($status) => $status['value'] > 0);
        return array_values($filtered);
    }
}