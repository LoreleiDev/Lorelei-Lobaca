import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import OrderDetailModal from "./DetailTransaksi";
import {
    CheckCircle,
    XCircle,
    ShoppingBag,
    Eye,
    ArrowLeft,
    AlertCircle,
    Loader
} from 'lucide-react';

export default function PaymentQris() {
    const location = useLocation();
    const navigate = useNavigate();
    const { qrCodeData, orderId } = location.state || {};
    const [paymentStatus, setPaymentStatus] = useState('pending');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState(qrCodeData || null);
    const [isLoadingQrCode, setIsLoadingQrCode] = useState(false);

    useEffect(() => {
        if (showDetailModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showDetailModal]);

    useEffect(() => {
        if (!orderId || qrCodeData) return;
        
        const fetchQrCode = async () => {
            try {
                setIsLoadingQrCode(true);
                const token = localStorage.getItem('user_token');
                const res = await fetch(`/api/transaction/${orderId}/status`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (res.ok) {
                    const data = await res.json();
                    if (data.data.qr_code_url) {
                        setQrCodeUrl(data.data.qr_code_url);
                    }
                }
            } catch (error) {
                console.error("Error fetching QR code:", error);
            } finally {
                setIsLoadingQrCode(false);
            }
        };

        fetchQrCode();
    }, [orderId, qrCodeData]);

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

    const fetchTransactionDetail = async () => {
        setIsLoadingDetail(true);
        try {
            const token = localStorage.getItem('user_token');
            
            const transactionsRes = await fetch('/api/order-history', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            const transactionsData = await transactionsRes.json();
            
            if (!transactionsData.success) {
                throw new Error(transactionsData.message || 'Gagal mengambil riwayat pesanan');
            }
            
            const transaction = transactionsData.data.find(
                t => t.order_id === orderId
            );
            
            if (!transaction) {
                throw new Error('Transaksi tidak ditemukan. Silakan cek riwayat pesanan Anda.');
            }
            
            const detailRes = await fetch(`/api/order-history/${transaction.transaksi_id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            const detailData = await detailRes.json();
            
            if (detailData.success) {
                setSelectedTransaction(detailData.data);
                setShowDetailModal(true);
            } else {
                throw new Error(detailData.message || 'Gagal mengambil detail transaksi');
            }
        } catch (error) {
            console.error('Error fetching transaction detail:', error);
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: error.message || 'Gagal mengambil detail transaksi'
            });
        } finally {
            setIsLoadingDetail(false);
        }
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedTransaction(null);
    };

    if (!orderId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-yellow-50">
                <p className="text-yellow-800 text-lg font-medium">Memuat...</p>
            </div>
        );
    }

    if (paymentStatus === 'success') {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="max-w-md mx-auto">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
                        <div className="w-24 h-24 bg-linear-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                            <CheckCircle className="h-12 w-12 text-white" />
                            <div className="absolute -top-1 -right-1 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <div className="w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Pembayaran Berhasil!</h2>
                        <p className="text-gray-600 mb-4">
                            Terima kasih! Pembayaran untuk pesanan Anda telah berhasil diproses.
                        </p>
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-6">
                            <div className="flex items-center justify-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-gray-500" />
                                <span className="font-mono text-sm font-semibold text-gray-800">
                                    Order ID: {orderId}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <button
                                onClick={fetchTransactionDetail}
                                disabled={isLoadingDetail}
                                className="cursor-pointer w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoadingDetail ? (
                                    <>
                                        <Loader className="animate-spin h-5 w-5 text-white" />
                                        Memuat...
                                    </>
                                ) : (
                                    <>
                                        <Eye className="w-5 h-5" />
                                        Lihat Detail Transaksi
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => navigate('/purchase-history')}
                                className="cursor-pointer w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-3 rounded-md transition-colors flex items-center justify-center gap-2"
                            >
                                <ShoppingBag className="w-5 h-5" />
                                Lihat Riwayat Pesanan
                            </button>
                            <button
                                onClick={() => navigate('/buku')}
                                className="cursor-pointer w-full bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium py-3 rounded-md transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Lanjutkan Belanja
                            </button>
                        </div>
                    </div>
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            <div className="text-left">
                                <h4 className="font-medium text-blue-800 text-sm mb-1">Informasi Penting</h4>
                                <p className="text-blue-600 text-sm">
                                    Detail transaksi telah dikirim ke email Anda.
                                    Pesanan akan diproses dalam 1-2 hari kerja.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                {showDetailModal && selectedTransaction && (
                    <OrderDetailModal
                        transaction={selectedTransaction}
                        onClose={closeDetailModal}
                    />
                )}
            </div>
        );
    }

    if (paymentStatus === 'failed') {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="max-w-md mx-auto">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
                        <div className="w-24 h-24 bg-linear-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="h-12 w-12 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Pembayaran Gagal</h2>
                        <p className="text-gray-600 mb-4">
                            Waktu pembayaran telah habis atau transaksi dibatalkan.
                        </p>
                        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6">
                            <div className="flex items-center justify-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-red-500" />
                                <span className="font-mono text-sm font-semibold text-red-800">
                                    Order ID: {orderId}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/buku')}
                                className="cursor-pointer w-full bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium py-3 rounded-md transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Lanjutkan Belanja
                            </button>
                        </div>
                    </div>
                    <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <div className="text-left">
                                <h4 className="font-medium text-red-800 text-sm mb-1">Penyelesaian Masalah</h4>
                                <p className="text-red-600 text-sm">
                                    Jika Anda mengalami kendala teknis, silakan hubungi customer service
                                    atau coba metode pembayaran lain.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-b from-blue-50 to-blue-100 py-8 px-4">
            <div className="max-w-md mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-900">
                    <div className="bg-gray-900 py-5 text-center">
                        <h1 className="text-2xl font-bold text-white tracking-wide">Bayar dengan QRIS</h1>
                    </div>
                    <div className="p-6">
                        <div className="text-center mb-6">
                            <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Order ID</p>
                            <p className="font-mono text-lg font-bold text-yellow-700 mt-1">{orderId}</p>
                        </div>
                        
                        {isLoadingQrCode ? (
                            <div className="flex justify-center mb-8">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
                            </div>
                        ) : qrCodeUrl ? (
                            <div className="flex justify-center mb-8">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-900">
                                    <img
                                        src={qrCodeUrl}
                                        alt="QRIS Code"
                                        className="w-48 h-48 object-contain"
                                        onError={(e) => {
                                            console.error("Failed to load QR image from URL:", qrCodeUrl);
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center mb-8">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-900">
                                    <div className="w-48 h-48 bg-gray-200 rounded flex items-center justify-center">
                                        <p className="text-gray-500 text-sm text-center">
                                            QR Code tidak tersedia.<br />
                                            Silakan cek status pembayaran Anda.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="bg-yellow-50 border-l-4 border-gray-900 rounded-r-lg p-4 mb-6">
                            <p className="font-bold text-yellow-800 mb-2">Instruksi Pembayaran:</p>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 pl-2">
                                <li>Buka aplikasi e-wallet</li>
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