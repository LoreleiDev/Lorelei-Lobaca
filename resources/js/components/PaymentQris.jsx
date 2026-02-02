import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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

export default function PaymentQris() {
    const location = useLocation();
    const navigate = useNavigate();
    const { qrCodeData, orderId } = location.state || {};
    const [paymentStatus, setPaymentStatus] = useState('pending');

    useEffect(() => {
        if (!orderId) return;
        const pollStatus = async () => {
            try {
                const token = localStorage.getItem('user_token');
                const res = await fetch(`/api/transaction/${orderId}/status`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const status = data.data.status_transaksi;
                    const adminAction = data.data.admin_action_status;
                    if (adminAction === 'rejected') {
                        setPaymentStatus('failed');
                        return;
                    }
                    if (status === 'transaksi-sukses' || status === 'transaksi-diterima') {
                        setPaymentStatus('success');
                    } else if (status === 'transaksi-kadaluarsa' || status === 'transaksi-ditolak') {
                        setPaymentStatus('failed');
                    }
                }
            } catch (error) {
                console.error("Polling error:", error);
            }
        };
        const intervalId = setInterval(pollStatus, 5000);
        pollStatus();
        return () => clearInterval(intervalId);
    }, [orderId]);

    if (!qrCodeData || !orderId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-yellow-50">
                <p className="text-yellow-800 text-lg font-medium">Memuat...</p>
            </div>
        );
    }

    if (paymentStatus === 'success') {
        return (
            <div className="min-h-screen bg-linear-to-b from-blue-50 to-blue-100 py-8 px-4">
                <div className="max-w-md mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center ">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Pembayaran Berhasil!</h2>
                        <p className="text-gray-600 mb-6">
                            Terima kasih! Pembayaran untuk pesanan <span className="font-mono font-bold text-yellow-700"><br />{orderId}<br /></span> telah diterima.
                        </p>
                        <Button
                            onClick={() => navigate('/purchase-history')}
                            className="w-full cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                            Lihat Detail Transaksi
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (paymentStatus === 'failed') {
        return (
            <div className="min-h-screen bg-linear-to-b from-blue-50 to-blue-100 py-8 px-4">
                <div className="max-w-md mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center ">
                        <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Pembayaran Gagal</h2>
                        <p className="text-gray-600 mb-6">
                            Waktu pembayaran untuk pesanan <span className="font-mono font-bold text-yellow-700"><br />{orderId}<br /></span> telah habis atau dibatalkan.
                        </p>
                        <Button
                            onClick={() => navigate('/cart')}
                            className="w-full cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                            Kembali ke Keranjang
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-b from-blue-50 to-blue-100 py-8 px-4">
            <div className="max-w-md mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 ">
                    <div className="bg-gray-900 py-5 text-center">
                        <h1 className="text-2xl font-bold text-white tracking-wide">Bayar dengan QRIS</h1>
                    </div>
                    <div className="p-6">
                        <div className="text-center mb-6">
                            <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Order ID</p>
                            <p className="font-mono text-lg font-bold text-yellow-700 mt-1">{orderId}</p>
                        </div>
                        <div className="flex justify-center mb-8">
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-900">
                                <img
                                    src={qrCodeData}
                                    alt="QRIS Code"
                                    className="w-48 h-48 object-contain"
                                    onError={(e) => {
                                        console.error("Failed to load QR image from URL:", qrCodeData);
                                    }}
                                />
                            </div>
                        </div>
                        <div className="bg-yellow-50 border-l-4 border-gray-900 rounded-r-lg p-4 mb-6">
                            <p className="font-bold text-yellow-800 mb-2">Instruksi Pembayaran:</p>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 pl-2">
                                <li>Buka aplikasi e-wallet </li>
                                <li>Pilih menu <strong>Scan QR</strong></li>
                                <li>Arahkan kamera ke kode QR di atas</li>
                                <li>Ikuti petunjuk untuk menyelesaikan pembayaran</li>
                            </ol>
                        </div>
                        <div className="text-center text-xs text-gray-500">
                            <p>Pembayaran akan otomatis diverifikasi setiap 5 detik.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}