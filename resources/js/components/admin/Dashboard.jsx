import { useState, useEffect } from "react";
import Sidebar from "./ui/Sidebar";
import Swal from "sweetalert2";

const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 1000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('click', () => {
            Swal.close();
        });
    }
});

export default function Dashboard() {
    document.title = "Dashboard - Lobaca Admin";
    
    const [totalPendapatan, setTotalPendapatan] = useState(0);
    const [totalBukuTerjual, setTotalBukuTerjual] = useState(0);
    const [loading, setLoading] = useState(true);
    const [timeRangeFilter, setTimeRangeFilter] = useState('monthly');

    useEffect(() => {
        fetchTotalPendapatan();
    }, [timeRangeFilter]);

    const fetchTotalPendapatan = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                Toast.fire({ icon: "error", title: "Admin belum login." });
                return;
            }

            let queryParams = [];
            if (timeRangeFilter) queryParams.push(`time_range=${timeRangeFilter}`);
            const queryString = queryParams.length > 0 ? '?' + queryParams.join('&') : '';

            const res = await fetch(`/api/admin/orders${queryString}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setTotalPendapatan(data.total_pendapatan || 0);
                setTotalBukuTerjual(data.total_buku_terjual || 0);
            } else {
                const error = await res.json().catch(() => ({ message: "Gagal memuat data." }));
                Toast.fire({ icon: "error", title: error.message || "Gagal memuat data." });
            }
        } catch (error) {
            console.error("Fetch error:", error);
            Toast.fire({ icon: "error", title: "Kesalahan jaringan." });
        } finally {
            setLoading(false);
        }
    };

    const formatRupiah = (angka) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(angka);
    };

    const getTimeRangeLabel = () => {
        switch (timeRangeFilter) {
            case 'daily': return 'Hari Ini';
            case 'weekly': return 'Minggu Ini';
            case 'monthly': return 'Bulan Ini';
            case 'yearly': return 'Tahun Ini';
            default: return 'Semua Waktu';
        }
    };

    return (
        <Sidebar>
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-foreground">
                    Dashboard Admin
                </h1>

                {/* Total Pendapatan Card */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-700">Total Pendapatan</h2>
                            <p className="text-sm text-gray-500">Periode: {getTimeRangeLabel()}</p>
                        </div>
                        <select
                            value={timeRangeFilter}
                            onChange={(e) => setTimeRangeFilter(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md text-sm focus:ring-yellow-500 focus:border-yellow-500"
                        >
                            <option value="">Semua Waktu</option>
                            <option value="daily">Harian</option>
                            <option value="weekly">Mingguan</option>
                            <option value="monthly">Bulanan</option>
                            <option value="yearly">Tahunan</option>
                        </select>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-700 mb-2">
                            <strong>Total Pendapatan:</strong>
                        </p>
                        {loading ? (
                            <p className="text-gray-500">Memuat...</p>
                        ) : (
                            <p className="text-2xl font-bold text-green-800">
                                {formatRupiah(totalPendapatan)}
                            </p>
                        )}
                    </div>
                </div>

                {/* Quick Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg shadow p-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Buku Terjual</h3>
                        <p className="text-2xl font-bold text-purple-600">{totalBukuTerjual.toLocaleString('id-ID')}</p>
                        <p className="text-xs text-gray-500 mt-1">Total semua waktu</p>
                    </div>
                </div>
            </div>
        </Sidebar>
    );
}