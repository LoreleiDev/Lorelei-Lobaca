import { useState, useEffect } from "react";
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

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/orders/pending', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(data.data || []);
            } else {
                Toast.fire({ icon: "error", title: "Gagal memuat data." });
            }
        } catch (error) {
            Toast.fire({ icon: "error", title: "Kesalahan jaringan." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const toggleDetail = (id) => {
        setShowDetails(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleAction = async (orderId, action) => {
        const token = localStorage.getItem('admin_token');
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
                    title: action === 'accept' ? "Pesanan diterima!" : "Pesanan ditolak."
                });
                fetchOrders();
            } else {
                const errorData = await res.json();
                Toast.fire({
                    icon: "error",
                    title: errorData.message || "Gagal memproses permintaan."
                });
            }
        } catch (error) {
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
                <h2 className="text-2xl font-bold mb-6">Notifikasi Pesanan Baru</h2>

                {orders.length === 0 ? (
                    <div className="text-gray-500">
                        Tidak ada pesanan yang menunggu konfirmasi.
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
                                        {showDetails[order.transaksi_id] && (
                                            <div className="mt-2 text-sm text-gray-700">
                                                <p><strong>User:</strong> {order.user?.name} ({order.user?.email})</p>
                                                <p><strong>Alamat:</strong> {order.alamat_pengiriman}</p>
                                                <p><strong>Total:</strong> {formatRupiah(order.total_harga)}</p>
                                                <p><strong>Kurir:</strong> {order.kurir} (Ongkir: {formatRupiah(order.ongkir)})</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => toggleDetail(order.transaksi_id)}
                                            className="text-xs text-blue-600 hover:underline"
                                        >
                                            {showDetails[order.transaksi_id] ? 'Sembunyikan' : 'Detail'}
                                        </button>

                                        <button
                                            onClick={() => handleAction(order.transaksi_id, 'accept')}
                                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                        >
                                            Terima
                                        </button>
                                        <button
                                            onClick={() => handleAction(order.transaksi_id, 'reject')}
                                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                        >
                                            Tolak
                                        </button>
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