import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
    X,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Ban,
    Package,
    Truck,
    Calendar,
    CreditCard,
    MapPin,
    BookOpen,
    User,
    Hash,
    Scale,
    ShoppingBag,
    Wallet,
    DollarSign
} from 'lucide-react';

export default function OrderDetailModal({ transaction, onClose }) {
    const [loading, setLoading] = useState(false);
    const [transactionDetail, setTransactionDetail] = useState(transaction);

    const statusConfig = {
        'transaksi-diproses': {
            label: 'Diproses',
            color: 'bg-blue-50',
            textColor: 'text-blue-700',
            borderColor: 'border-blue-200',
            icon: <Clock className="w-4 h-4" />
        },
        'transaksi-sukses': {
            label: 'Berhasil',
            color: 'bg-green-50',
            textColor: 'text-green-700',
            borderColor: 'border-green-200',
            icon: <CheckCircle className="w-4 h-4" />
        },
        'transaksi-dibatalkan': {
            label: 'Dibatalkan',
            color: 'bg-red-50',
            textColor: 'text-red-700',
            borderColor: 'border-red-200',
            icon: <XCircle className="w-4 h-4" />
        },
        'transaksi-kadaluarsa': {
            label: 'Kadaluarsa',
            color: 'bg-gray-50',
            textColor: 'text-gray-700',
            borderColor: 'border-gray-200',
            icon: <AlertCircle className="w-4 h-4" />
        },
        'transaksi-ditolak': {
            label: 'Ditolak',
            color: 'bg-red-50',
            textColor: 'text-red-700',
            borderColor: 'border-red-200',
            icon: <Ban className="w-4 h-4" />
        },
    };

    useEffect(() => {
        if (transaction && !transaction.items) {
            fetchTransactionDetail();
        }
    }, [transaction]);

    const fetchTransactionDetail = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('user_token');

            const response = await fetch(`/api/order-history/${transaction.transaksi_id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                setTransactionDetail(result.data);
            } else {
                throw new Error(result.message || 'Gagal mengambil detail transaksi');
            }
        } catch (error) {
            console.error('Error fetching transaction detail:', error);
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: error.message || 'Gagal mengambil detail transaksi'
            });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount).replace('Rp', 'Rp ').trim();
    };

    const formatNumber = (number) => {
        return new Intl.NumberFormat('id-ID').format(number);
    };

    const getStatusBadge = (status) => {
        const config = statusConfig[status] || {
            label: 'Unknown',
            color: 'bg-gray-50',
            textColor: 'text-gray-700',
            borderColor: 'border-gray-200',
            icon: <AlertCircle className="w-4 h-4" />
        };
        return (
            <span className={`${config.color} ${config.textColor} border ${config.borderColor} px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2`}>
                {config.icon} {config.label}
            </span>
        );
    };

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!transactionDetail) {
        return null;
    }

    return (
        <div className="fixed inset-0  bg-gray-500/70 flex items-center justify-center p-4 z-50" onClick={handleBackdropClick}>
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="bg-gray-800 p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Package className="w-6 h-6" />
                        <div>
                            <h1 className="text-xl font-semibold">Detail Pesanan</h1>
                            <p className="text-gray-300 text-sm mt-1">Order ID: {transactionDetail.order_id}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {getStatusBadge(transactionDetail.status_transaksi)}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
                            <p className="text-gray-600 mt-4">Memuat detail transaksi...</p>
                        </div>
                    ) : (
                        <>
                            {/* Order Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Calendar className="w-4 h-4 text-gray-600" />
                                        <h3 className="font-semibold text-gray-700">Informasi Pesanan</h3>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Calendar className="w-3 h-3" />
                                                <span>Tanggal:</span>
                                            </div>
                                            <span className="text-gray-800 font-medium">
                                                {new Date(transactionDetail.created_at).toLocaleDateString('id-ID', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <CreditCard className="w-3 h-3" />
                                                <span>Metode Pembayaran:</span>
                                            </div>
                                            <span className="text-gray-800 font-medium">{transactionDetail.payment_method.toUpperCase()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Wallet className="w-3 h-3" />
                                                <span>Status:</span>
                                            </div>
                                            <span className="text-gray-800 font-medium">{statusConfig[transactionDetail.status_transaksi]?.label}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <MapPin className="w-4 h-4 text-gray-600" />
                                        <h3 className="font-semibold text-gray-700">Alamat Pengiriman</h3>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                        <p className="text-gray-800 mb-2">{transactionDetail.alamat_pengiriman}</p>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Truck className="w-3 h-3" />
                                                <span>Kurir:</span>
                                            </div>
                                            <span className="text-gray-800 font-medium">{transactionDetail.kurir}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <DollarSign className="w-3 h-3" />
                                                <span>Ongkir:</span>
                                            </div>
                                            <span className="text-gray-800 font-medium">{formatCurrency(transactionDetail.ongkir)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                                    <ShoppingBag className="w-5 h-5 text-gray-600" />
                                    <h3 className="font-semibold text-gray-700">Daftar Barang</h3>
                                </div>
                                <div className="space-y-4">
                                    {transactionDetail.items?.map((item) => (
                                        <div key={item.buku_id} className="flex gap-4 p-4 bg-gray-50 rounded-md border border-gray-200 hover:border-gray-300 transition-colors">
                                            <img
                                                src={item.gambar}
                                                alt={item.judul}
                                                className="w-20 h-24 object-cover rounded border border-gray-300"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-medium text-gray-800 flex items-center gap-2">
                                                            <BookOpen className="w-4 h-4 text-gray-500" />
                                                            {item.judul}
                                                        </h4>
                                                        <p className="text-gray-600 text-sm mt-1 flex items-center gap-2">
                                                            <User className="w-3 h-3" />
                                                            {item.penulis}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-3 text-xs">
                                                    <span className="bg-white px-2 py-1 rounded border border-gray-300 flex items-center gap-1">
                                                        Qty: {formatNumber(item.jumlah)}
                                                    </span>
                                                    <span className="bg-white px-2 py-1 rounded border border-gray-300 flex items-center gap-1">
                                                        {formatCurrency(item.harga_satuan)}
                                                    </span>
                                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-300 font-medium flex items-center gap-1">
                                                        Subtotal: {formatCurrency(item.subtotal)}
                                                    </span>
                                                    {item.has_promo && (
                                                        <span className="bg-red-50 text-red-700 px-2 py-1 rounded border border-red-200 font-medium flex items-center gap-1">
                                                            Promo: {item.discount_percent}% off
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                                                    {item.penerbit && (
                                                        <span className="flex items-center gap-1">
                                                            Penerbit: {item.penerbit}
                                                        </span>
                                                    )}
                                                    {item.tahun && (
                                                        <span className="flex items-center gap-1">
                                                            Tahun: {item.tahun}
                                                        </span>
                                                    )}
                                                    {item.isbn && (
                                                        <span className="flex items-center gap-1">
                                                            <Hash className="w-3 h-3" />
                                                            ISBN: {item.isbn}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Total Summary */}
                            <div className="bg-gray-50 p-6 rounded-md border border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="text-sm text-gray-600 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Scale className="w-4 h-4" />
                                            <span>Total Berat: {formatNumber(transactionDetail.total_berat || 0)} gram</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ShoppingBag className="w-4 h-4" />
                                            <span>Jumlah Item: {formatNumber(transactionDetail.items?.length || 0)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-4 h-4" />
                                            <span>Biaya Pengiriman: {formatCurrency(transactionDetail.ongkir || 0)}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600 mb-1">Total Pembayaran</p>
                                        <p className="text-2xl font-semibold text-gray-800 flex items-center justify-end gap-2">
                                            <Wallet className="w-6 h-6" />
                                            {formatCurrency(transactionDetail.total_harga)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Termasuk ongkir dan biaya lainnya
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}