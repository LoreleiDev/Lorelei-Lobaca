import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; 
import Sidebar from "./ui/Sidebar";
import Swal from "sweetalert2";

const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    }
});

export default function PesananPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDetails, setShowDetails] = useState({});

    // State untuk filter
    const [statusFilter, setStatusFilter] = useState('');
    const [timeRangeFilter, setTimeRangeFilter] = useState('');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                Toast.fire({ icon: "error", title: "Admin belum login." });
                return;
            }

            // Bangun query parameter
            let queryParams = [];
            if (statusFilter) queryParams.push(`status=${statusFilter}`);
            if (timeRangeFilter) queryParams.push(`time_range=${timeRangeFilter}`);
            if (customStartDate && customEndDate) {
                queryParams.push(`start_date=${customStartDate}`, `end_date=${customEndDate}`);
            }

            const queryString = queryParams.length > 0 ? '?' + queryParams.join('&') : '';
            const url = `/api/admin/orders${queryString}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const data = await res.json();
                    setOrders(data.data || []);
                } else {
                    const text = await res.text();
                    console.error("Response bukan JSON:", text);
                    Toast.fire({ icon: "error", title: "Server mengembalikan data tidak valid." });
                }
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

    useEffect(() => {
        fetchOrders();
    }, [statusFilter, timeRangeFilter, customStartDate, customEndDate]);

    const toggleDetail = (id) => {
        setShowDetails(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAction = async (orderId, action) => {
        if (action === 'reject') {
            const result = await Swal.fire({
                title: 'Yakin ingin membatalkan & refund pesanan?',
                text: "Stok barang akan dikembalikan, dan uang akan dikembalikan ke pelanggan melalui Midtrans.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ya, batalkan & refund!',
                cancelButtonText: 'Batal'
            });
            if (!result.isConfirmed) return;
        }

        const token = localStorage.getItem('admin_token');
        if (!token) {
            Toast.fire({ icon: "error", title: "Sesi admin habis." });
            return;
        }

        try {
            const res = await fetch(`/api/admin/orders/${orderId}/${action}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                Toast.fire({
                    icon: "success",
                    title: action === 'approve' ? "Pesanan dikonfirmasi!" : "Pesanan dibatalkan & refund diproses."
                });
                fetchOrders(); // Refresh daftar
            } else {
                const errorData = await res.json().catch(() => ({ message: "Gagal memproses permintaan." }));
                Toast.fire({
                    icon: "error",
                    title: errorData.message || "Gagal memproses permintaan."
                });
            }
        } catch (error) {
            console.error("Action error:", error);
            Toast.fire({ icon: "error", title: "Kesalahan jaringan." });
        }
    };

    const handleRefund = async (orderId) => {
        const result = await Swal.fire({
            title: 'Yakin ingin mengembalikan uang?',
            text: "Proses ini akan memanggil Midtrans untuk refund.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, refund!',
            cancelButtonText: 'Batal'
        });
        if (!result.isConfirmed) return;

        const token = localStorage.getItem('admin_token');
        if (!token) {
            Toast.fire({ icon: "error", title: "Sesi admin habis." });
            return;
        }

        try {
            const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                Toast.fire({
                    icon: "success",
                    title: "Refund berhasil diproses!"
                });
                fetchOrders(); // Refresh daftar
            } else {
                const errorData = await res.json().catch(() => ({ message: "Gagal memproses refund." }));
                Toast.fire({
                    icon: "error",
                    title: errorData.message || "Gagal memproses refund."
                });
            }
        } catch (error) {
            console.error("Refund error:", error);
            Toast.fire({ icon: "error", title: "Kesalahan jaringan." });
        }
    };

    const formatRupiah = (angka) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(angka);
    };

    if (loading) {
        return (
            <Sidebar>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-600">Memuat...</p>
                </div>
            </Sidebar>
        );
    }

    return (
        <Sidebar>
            <div>
                <h2 className="text-2xl font-bold mb-6">Kelola Pesanan</h2>

                {/* Filter Section */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                            >
                                <option value="">Semua Status</option>
                                <option value="pending">Menunggu</option>
                                <option value="approved">Diterima</option>
                                <option value="rejected">Ditolak</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rentang Waktu</label>
                            <select
                                value={timeRangeFilter}
                                onChange={(e) => setTimeRangeFilter(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                            >
                                <option value="">Pilih Rentang</option>
                                <option value="daily">Harian</option>
                                <option value="weekly">Mingguan</option>
                                <option value="monthly">Bulanan</option>
                                <option value="yearly">Tahunan</option>
                                <option value="">Custom Range</option>
                            </select>
                        </div>

                        {(timeRangeFilter === '' && customStartDate === '') && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                                    <input
                                        type="date"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Akhir</label>
                                    <input
                                        type="date"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Order List */}
                {orders.length === 0 ? (
                    <div className="text-gray-500">
                        Tidak ada pesanan yang ditemukan.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map(order => (
                            <div key={order.transaksi_id} className="border rounded-lg p-4 shadow-sm bg-white">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-mono text-sm text-gray-600">
                                            ID: {order.transaction_id_midtrans}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Status: <span className={`font-semibold ${order.admin_action_status === 'pending' ? 'text-yellow-600' : order.admin_action_status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                                                {order.admin_action_status === 'pending' ? 'Menunggu' : order.admin_action_status === 'approved' ? 'Diterima' : 'Ditolak'}
                                            </span>
                                        </p>
                                        {/* Tampilkan Metode Pembayaran */}
                                        <p className="text-xs text-gray-500">
                                            Pembayaran: <span className="font-semibold">{order.payment_method || 'Metode Tidak Diketahui'}</span>
                                        </p>
                                        {showDetails[order.transaksi_id] && (
                                            <div className="mt-2 text-sm text-gray-700 space-y-1">
                                                <p><strong>User:</strong> {order.user?.name} ({order.user?.email})</p>
                                                <p><strong>Alamat:</strong> {order.alamat_pengiriman}</p>
                                                <p><strong>Total:</strong> {formatRupiah(order.total_harga)}</p>
                                                <p><strong>Kurir:</strong> {order.kurir} (Ongkir: {formatRupiah(order.ongkir)})</p>
                                                <p><strong>Dibuat:</strong> {new Date(order.created_at).toLocaleString()}</p>
                                                <div className="mt-3">
                                                    <p className="font-semibold text-gray-800">Detail Barang:</p>
                                                    <ul className="list-disc pl-5 mt-1 space-y-1">
                                                        {order.transaksi_detail && order.transaksi_detail.length > 0 ? (
                                                            order.transaksi_detail.map(detail => (
                                                                <li key={detail.id}>
                                                                    {detail.buku?.judul || 'Buku Tidak Dikenal'} - Jumlah: {detail.jumlah} - Harga: {formatRupiah(detail.harga_satuan)}
                                                                </li>
                                                            ))
                                                        ) : (
                                                            <li>Tidak ada detail barang.</li>
                                                        )}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => toggleDetail(order.transaksi_id)}
                                            className="text-xs text-blue-600 hover:underline"
                                        >
                                            {showDetails[order.transaksi_id] ? 'Sembunyikan' : 'Detail'}
                                        </button>
                                        {order.admin_action_status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleAction(order.transaksi_id, 'approve')}
                                                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                                >
                                                    Konfirmasi
                                                </button>
                                                {/* Cek apakah metode pembayaran bukan bank_transfer */}
                                                {order.payment_method !== 'bank_transfer' && (
                                                    <button
                                                        onClick={() => handleAction(order.transaksi_id, 'reject')}
                                                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                                    >
                                                        Batalkan & Refund
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {order.admin_action_status === 'approved' && (
                                            <Link
                                                to="/admin/atur-pesanan" // Ganti URL ini sesuai kebutuhan
                                                className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 text-center"
                                            >
                                                Atur Pesanan
                                            </Link>
                                        )}
                                        {order.admin_action_status === 'rejected' && (
                                            <button
                                                onClick={() => handleRefund(order.transaksi_id)}
                                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                            >
                                                Refund
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Sidebar>
    );
}