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
    const [timeRangeFilter, setTimeRangeFilter] = useState('');
    const [sortOption, setSortOption] = useState('terbaru');
    const [totalPendapatan, setTotalPendapatan] = useState(0);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                Toast.fire({ icon: "error", title: "Admin belum login." });
                return;
            }

            let queryParams = [];
            if (timeRangeFilter) {
                queryParams.push(`time_range=${timeRangeFilter}`);
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
                    setTotalPendapatan(data.total_pendapatan || 0);
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
    }, [timeRangeFilter]);

    const toggleDetail = (id) => {
        setShowDetails(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAction = async (orderId, action) => {
        if (action === 'reject') {
            const result = await Swal.fire({
                title: 'Yakin ingin membatalkan pesanan?',
                text: "Stok barang akan dikembalikan. Dana tidak akan dikembalikan secara otomatis untuk pembayaran VA.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ya, batalkan!',
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
                    title: action === 'approve' ? "Pesanan dikonfirmasi!" : "Pesanan dibatalkan."
                });
                fetchOrders();
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

    const formatRupiah = (angka) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(angka);
    };

    const getSortedOrders = () => {
        let sorted = [...orders];
        switch (sortOption) {
            case 'abjad':
                return sorted.sort((a, b) => {
                    const nameA = (a.user?.name || '').toLowerCase();
                    const nameB = (b.user?.name || '').toLowerCase();
                    return nameA.localeCompare(nameB);
                });
            case 'terlama':
                return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            case 'termahal':
                return sorted.sort((a, b) => b.total_harga - a.total_harga);
            case 'termurah':
                return sorted.sort((a, b) => a.total_harga - b.total_harga);
            case 'terbaru':
            default:
                return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
    };

    const sortedOrders = getSortedOrders();

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
                <h2 className="text-2xl font-bold mb-4">Kelola Pesanan</h2>

                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                        <strong>Total Pendapatan:</strong> {formatRupiah(totalPendapatan)}
                    </p>
                </div>

                {/* Filter Section: Waktu + Urutan sejajar */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rentang Waktu</label>
                            <select
                                value={timeRangeFilter}
                                onChange={(e) => setTimeRangeFilter(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                            >
                                <option value="">Semua Waktu</option>
                                <option value="daily">Harian</option>
                                <option value="weekly">Mingguan</option>
                                <option value="monthly">Bulanan</option>
                                <option value="yearly">Tahunan</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Urutkan Berdasarkan</label>
                            <select
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                            >
                                <option value="terbaru">Terbaru</option>
                                <option value="terlama">Terlama</option>
                                <option value="abjad">Abjad (A–Z)</option>
                                <option value="termahal">Termahal</option>
                                <option value="termurah">Termurah</option>
                            </select>
                        </div>
                    </div>
                </div>

                {sortedOrders.length === 0 ? (
                    <div className="text-gray-500">
                        Tidak ada pesanan yang ditemukan.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sortedOrders.map(order => (
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
                                        <p className="text-xs text-gray-500">
                                            Pembayaran: <span className="font-semibold">{order.payment_method || 'Metode Tidak Diketahui'}</span>
                                        </p>
                                        {showDetails[order.transaksi_id] && (
                                            <div className="mt-2 text-sm text-gray-700 space-y-1">
                                                <p><strong>User:</strong> {order.user?.name} ({order.user?.email})</p>
                                                <p><strong>Alamat:</strong> {order.alamat_pengiriman}</p>
                                                <p><strong>Total:</strong> {formatRupiah(order.total_harga)}</p>
                                                <p><strong>Kurir:</strong> {order.kurir} (Ongkir: {formatRupiah(order.ongkir)})</p>
                                                <p><strong>Dibuat:</strong> {new Date(order.created_at).toLocaleDateString('id-ID', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}</p>
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
                                                <button
                                                    onClick={() => handleAction(order.transaksi_id, 'reject')}
                                                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                                >
                                                    Batalkan
                                                </button>
                                            </>
                                        )}
                                        {order.admin_action_status === 'approved' && (
                                            <Link
                                                to="/admin/atur-pesanan"
                                                className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 text-center"
                                            >
                                                Atur Pesanan
                                            </Link>
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