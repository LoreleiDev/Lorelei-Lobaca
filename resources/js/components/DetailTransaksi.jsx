import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Tag, ChevronRight } from "lucide-react";
import NavbarHome from "./ui/NavbarHome";
import Loading from "./ui/Loading";
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

const statusLabels = {
    'pesanan-disiapkan': 'Pesanan Disiapkan',
    'transaksi-sukses': 'Pembayaran Sukses',
    'pesanan-sedang-dikirim': 'Sedang Dikirim',
    'pesanan-telah-diterima': 'Telah Diterima',
    'pesanan-ditunda': 'Pesanan Ditunda',
    'transaksi-diproses': 'Transaksi Diproses',
    'transaksi-ditolak': 'Transaksi Ditolak',
    'transaksi-dibatalkan': 'Transaksi Dibatalkan',
    'transaksi-kadaluarsa': 'Transaksi Kadaluarsa'
};

export default function DetailTransaksiPage() {
    document.title = "Detail Transaksi - Lobaca";
    const navigate = useNavigate();
    const { id } = useParams(); // Ambil ID dari URL
    const [transaksi, setTransaksi] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransaksi = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('user_token');
                if (!token) {
                    Toast.fire({ icon: "error", title: "Silakan login terlebih dahulu." });
                    navigate('/login');
                    return;
                }

                const res = await fetch(`/api/transaksi/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    setTransaksi(data.data.transaksi);
                } else {
                    Toast.fire({ icon: "error", title: "Gagal memuat transaksi." });
                    navigate('/keranjang');
                }
            } catch (error) {
                Toast.fire({ icon: "error", title: "Kesalahan jaringan." });
            } finally {
                setLoading(false);
            }
        };

        fetchTransaksi();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loading />
            </div>
        );
    }

    if (!transaksi) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-600">Transaksi tidak ditemukan.</p>
            </div>
        );
    }

    const calculateTotals = () => {
        let subtotal = 0;
        let totalDiscount = 0;

        transaksi.transaksiDetails.forEach(item => {
            const originalPrice = item.harga_satuan + (item.harga_satuan * item.buku.discount_percent / 100); // Harga asli
            const discountAmount = item.buku.discount_percent > 0 ? (originalPrice * item.buku.discount_percent / 100) : 0;
            totalDiscount += discountAmount * item.jumlah;
            subtotal += originalPrice * item.jumlah;
        });

        return {
            subtotal,
            totalDiscount,
            finalTotal: subtotal - totalDiscount
        };
    };

    const { subtotal, totalDiscount, finalTotal } = calculateTotals();

    return (
        <>
            <NavbarHome />
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Detail Transaksi</h1>
                        <p className="text-gray-600 mt-1">Periksa dan atur buku yang ingin kamu beli</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Daftar Item */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                <div className="p-4 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-800">Daftar Barang</h2>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {transaksi.transaksiDetails.map((item) => {
                                        const originalPrice = item.harga_satuan + (item.harga_satuan * item.buku.discount_percent / 100);
                                        const discountPercent = item.buku.discount_percent || 0;
                                        const discountAmount = discountPercent > 0 ? Math.round(originalPrice * discountPercent / 100) : 0;
                                        const discountedPrice = originalPrice - discountAmount;
                                        const itemTotal = discountedPrice * item.jumlah;

                                        return (
                                            <div key={item.transaksi_detail_id} className="p-4 flex flex-col sm:flex-row gap-4">
                                                <img
                                                    src={item.buku.foto || "/placeholder.svg"}
                                                    alt={item.buku.judul}
                                                    className="w-24 h-32 object-cover rounded-md border border-gray-200"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex justify-between">
                                                        <h3 className="font-semibold text-gray-800">{item.buku.judul}</h3>
                                                    </div>
                                                    <p className="text-gray-600 text-sm">{item.buku.penulis}</p>

                                                    {/* Kategori */}
                                                    {item.buku.kategori && (
                                                        <div className="mt-1 flex flex-wrap gap-1">
                                                            {item.buku.kategori.split(',').map((cat, i) => (
                                                                <span
                                                                    key={i}
                                                                    className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full truncate"
                                                                >
                                                                    {cat.trim()}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Harga */}
                                                    <div className="mt-3 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-gray-800 font-medium">{item.jumlah}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            {discountPercent > 0 ? (
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-green-600 font-bold">
                                                                        {new Intl.NumberFormat('id-ID', {
                                                                            style: 'currency',
                                                                            currency: 'IDR',
                                                                            minimumFractionDigits: 0
                                                                        }).format(itemTotal)}
                                                                    </span>
                                                                    <span className="text-gray-500 line-through text-xs">
                                                                        {new Intl.NumberFormat('id-ID', {
                                                                            style: 'currency',
                                                                            currency: 'IDR',
                                                                            minimumFractionDigits: 0
                                                                        }).format(originalPrice * item.jumlah)}
                                                                    </span>
                                                                    <span className="text-red-600 text-xs">
                                                                        -{new Intl.NumberFormat('id-ID', {
                                                                            style: 'currency',
                                                                            currency: 'IDR',
                                                                            minimumFractionDigits: 0
                                                                        }).format(discountAmount * item.jumlah)}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-800 font-bold">
                                                                    {new Intl.NumberFormat('id-ID', {
                                                                        style: 'currency',
                                                                        currency: 'IDR',
                                                                        minimumFractionDigits: 0
                                                                    }).format(itemTotal)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Ringkasan Belanja */}
                        <div>
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4">Ringkasan Belanja</h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span>
                                            {new Intl.NumberFormat('id-ID', {
                                                style: 'currency',
                                                currency: 'IDR',
                                                minimumFractionDigits: 0
                                            }).format(subtotal)}
                                        </span>
                                    </div>
                                    {totalDiscount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Diskon</span>
                                            <span>
                                                -{new Intl.NumberFormat('id-ID', {
                                                    style: 'currency',
                                                    currency: 'IDR',
                                                    minimumFractionDigits: 0
                                                }).format(totalDiscount)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="border-t border-gray-200 pt-3 mt-3">
                                        <div className="flex justify-between font-bold text-lg text-gray-800">
                                            <span>Total</span>
                                            <span>
                                                {new Intl.NumberFormat('id-ID', {
                                                    style: 'currency',
                                                    currency: 'IDR',
                                                    minimumFractionDigits: 0
                                                }).format(finalTotal)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <h3 className="font-semibold text-gray-800 mb-2">Status Transaksi</h3>
                                        <p className="text-gray-600">
                                            {statusLabels[transaksi.status_transaksi] || transaksi.status_transaksi}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => {
                                        // Redirect ke Midtrans
                                        window.location.href = `https://app.sandbox.midtrans.com/snap/v3/redirection/${transaksi.snap_token}`;
                                    }}
                                    className="w-full mt-6 bg-blue-600 hover:bg-blue-700 py-3 font-medium"
                                >
                                    Lanjutkan ke Pembayaran
                                </Button>
                                <Link to="/buku" className="block text-center mt-3 text-blue-600 hover:text-blue-800 text-sm">
                                    ← Lanjutkan Belanja
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}