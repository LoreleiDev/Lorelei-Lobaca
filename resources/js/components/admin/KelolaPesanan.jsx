import { useState, useEffect } from "react";
import Sidebar from "./ui/Sidebar";
import Swal from "sweetalert2";
import AturPesananPopup from "./ui/KelolaPesananPopup";
import DetailPesananPopup from "./ui/DetailPesananPopup";

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

export default function PesananPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRangeFilter, setTimeRangeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortOption, setSortOption] = useState('terbaru');
    const [showPopupModal, setShowPopupModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedDetailOrder, setSelectedDetailOrder] = useState(null);

    useEffect(() => {
        if (showPopupModal || showDetailModal) {
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = '0';
        } else {
            document.body.style.overflow = 'auto';
            document.body.style.paddingRight = '0';
        }

        return () => {
            document.body.style.overflow = 'auto';
            document.body.style.paddingRight = '0';
        };
    }, [showPopupModal, showDetailModal]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                Toast.fire({ icon: "error", title: "Admin belum login." });
                return;
            }

            let queryParams = [];
            if (timeRangeFilter) queryParams.push(`time_range=${timeRangeFilter}`);
            if (statusFilter) queryParams.push(`status=${statusFilter}`);
            const queryString = queryParams.length > 0 ? '?' + queryParams.join('&') : '';

            const res = await fetch(`/api/admin/orders${queryString}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setOrders(data.data || []);
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
    }, [timeRangeFilter, statusFilter]);

    const openDetailModal = (order) => {
        setSelectedDetailOrder(order);
        setShowDetailModal(true);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedDetailOrder(null);
    };

    const handleAction = async (orderId, action) => {
        if (action === 'reject') {
            const result = await Swal.fire({
                title: 'Yakin ingin membatalkan pesanan?',
                text: "Stok barang akan dikembalikan. Dana akan dikembalikan ke pelanggan.",
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
            const endpoint = action === 'approve' ? 'approve' : 'reject';
            const res = await fetch(`/api/admin/orders/${orderId}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                const messages = {
                    approve: "Pesanan dikonfirmasi!",
                    reject: "Pesanan dibatalkan dan dana dikembalikan."
                };
                Toast.fire({ icon: "success", title: messages[action] });
                fetchOrders();
            } else {
                const errorData = await res.json().catch(() => ({ message: "Gagal memproses permintaan." }));
                Toast.fire({ icon: "error", title: errorData.message || "Gagal memproses permintaan." });
            }
        } catch (error) {
            console.error("Action error:", error);
            Toast.fire({ icon: "error", title: "Kesalahan jaringan." });
        }
    };

    const openAturPesananModal = (order) => {
        setSelectedOrder(order);
        setShowPopupModal(true);
    };

    const closeAturPesananModal = () => {
        setShowPopupModal(false);
        setSelectedOrder(null);
    };

    const handleShippingUpdated = () => {
        Toast.fire({ icon: "success", title: "Status pengiriman diperbarui." });
        fetchOrders();
        closeAturPesananModal();
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
                return sorted.sort((a, b) => (a.user?.name || '').localeCompare(b.user?.name || ''));
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

                <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                            >
                                <option value="">Semua Status</option>
                                <option value="pending">Pending</option>
                                <option value="rejected">Ditolak</option>
                                <option value="approved">Diterima</option>
                                <option value="transaksi-kadaluarsa">Expired</option>
                                <option value="pesanan-sedang-dikirim">Sedang Dikirim</option>
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
                    <div className="text-gray-500">Tidak ada pesanan yang ditemukan.</div>
                ) : (
                    <div className="space-y-4">
                        {sortedOrders.map(order => {
                            const isExpired = order.status_transaksi === 'transaksi-kadaluarsa';
                            const isPending = order.admin_action_status === 'pending';
                            const isRejected = order.admin_action_status === 'rejected';
                            const isApproved = order.admin_action_status === 'approved';
                            const isShipped = order.status_transaksi === 'pesanan-sedang-dikirim';
                            const paymentStatus = order.status_transaksi;
                            const isPaid = paymentStatus === 'transaksi-sukses';
                            const isUnpaid = paymentStatus === 'transaksi-diproses';

                            return (
                                <div key={order.transaksi_id} className="border rounded-lg p-4 shadow-sm bg-white">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-mono text-sm text-gray-600">ID: {order.transaction_id_midtrans}</p>
                                            <p className="text-xs text-gray-500">
                                                Status: <span className={`font-semibold ${isExpired ? 'text-red-600' :
                                                    isPending ? 'text-yellow-600' :
                                                        isApproved ? 'text-green-600' :
                                                            isShipped ? 'text-blue-600' :
                                                                'text-red-600'
                                                    }`}>
                                                    {isExpired ? 'Expired' :
                                                        isPending ? 'Menunggu' :
                                                            isApproved ? 'Diterima' :
                                                                isShipped ? 'Dikirim' :
                                                                    'Ditolak'}
                                                </span>
                                            </p>
                                            {isShipped && (
                                                <p className="text-xs text-gray-500">
                                                    <span className="font-semibold text-blue-600">
                                                        Resi: {order.resi_pengiriman || 'N/A'} | Tgl Kirim: {order.tanggal_dikirim ? new Date(order.tanggal_dikirim).toLocaleDateString('id-ID') : 'N/A'}
                                                    </span>
                                                </p>
                                            )}
                                            {!isExpired && !isShipped && (
                                                <p className="text-xs text-gray-500">
                                                    Status Pembayaran: <span className={`font-semibold ${isPaid ? 'text-green-600' : 'text-red-600'}`}>
                                                        {isPaid ? 'Sudah Dibayar' : 'Belum Dibayar'}
                                                    </span>
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500">
                                                Pembayaran: <span className="font-semibold">{order.payment_method || 'Metode Tidak Diketahui'}</span>
                                            </p>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => openDetailModal(order)}
                                                className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 cursor-pointer"
                                            >
                                                Detail
                                            </button>

                                            {isShipped ? (
                                                <span className="text-xs text-blue-600 font-semibold">DIKIRIM</span>
                                            ) : isExpired ? (
                                                <span className="text-xs text-red-600 font-semibold">EXPIRED</span>
                                            ) : isRejected ? (
                                                <span className="text-xs text-purple-600 font-semibold">DITOLAK</span>
                                            ) : isPending ? (
                                                isUnpaid ? (
                                                    <span className="text-xs text-red-600 font-semibold">BELUM DIBAYAR</span>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction(order.transaksi_id, 'approve')}
                                                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                                        >
                                                            Terima
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(order.transaksi_id, 'reject')}
                                                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 mt-1"
                                                        >
                                                            Batalkan & Refund
                                                        </button>
                                                    </>
                                                )
                                            ) : isApproved ? (
                                                <button
                                                    onClick={() => openAturPesananModal(order)}
                                                    className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 cursor-pointer"
                                                >
                                                    Atur Pesanan
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                
                {/* Modal Detail Pesanan */}
                {showDetailModal && selectedDetailOrder && (
                    <DetailPesananPopup
                        order={selectedDetailOrder}
                        onClose={closeDetailModal}
                    />
                )}

                {/* Modal Atur Pengiriman */}
                {showPopupModal && selectedOrder && (
                    <AturPesananPopup
                        order={selectedOrder}
                        onClose={closeAturPesananModal}
                        onSuccess={handleShippingUpdated}
                    />
                )}
            </div>
        </Sidebar>
    );
}