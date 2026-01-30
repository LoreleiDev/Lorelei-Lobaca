import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import OrderDetailModal from './DetailTransaksi';
import NavbarHome from './ui/NavbarHome';
import Loading from "./ui/Loading";
import {
    Package,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Ban,
    CreditCard,
    Truck,
    ShoppingBag,
    Wallet,
    ChevronRight,
    Home,
    Filter,
    Calendar,
    User,
    BookOpen,
    X,
    Edit,
    CalendarDays,
    ChevronDown,
    RefreshCw,
    DollarSign
} from 'lucide-react';

export default function OrderHistory() {
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [dateFilter, setDateFilter] = useState({
        start: '',
        end: ''
    });
    const navigate = useNavigate();

    const statusConfig = {
        'transaksi-diproses': {
            label: 'Pembayaran Diproses',
            color: 'bg-blue-50',
            textColor: 'text-blue-700',
            borderColor: 'border-blue-200',
            icon: <Clock className="w-4 h-4" />
        },
        'transaksi-sukses': {
            label: 'Pembayaran Berhasil',
            color: 'bg-green-50',
            textColor: 'text-green-700',
            borderColor: 'border-green-200',
            icon: <CheckCircle className="w-4 h-4" />
        },
        'transaksi-dibatalkan': {
            label: 'Pembayaran Dibatalkan',
            color: 'bg-red-50',
            textColor: 'text-red-700',
            borderColor: 'border-red-200',
            icon: <XCircle className="w-4 h-4" />
        },
        'transaksi-kadaluarsa': {
            label: 'Pembayaran Kadaluarsa',
            color: 'bg-gray-50',
            textColor: 'text-gray-700',
            borderColor: 'border-gray-200',
            icon: <AlertCircle className="w-4 h-4" />
        },
        'transaksi-ditolak': {
            label: 'Pembayaran Ditolak',
            color: 'bg-red-50',
            textColor: 'text-red-700',
            borderColor: 'border-red-200',
            icon: <Ban className="w-4 h-4" />
        },
    };

    useEffect(() => {
        fetchOrderHistory();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [activeTab, dateFilter, transactions]);

    useEffect(() => {
        if (showDetailModal) {
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
    }, [showDetailModal]);

    const fetchOrderHistory = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('user_token');

            const response = await fetch('/api/order-history/', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                setTransactions(result.data);
            } else {
                throw new Error(result.message || 'Gagal mengambil riwayat pesanan');
            }
        } catch (error) {
            console.error('Error fetching order history:', error);
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: error.message || 'Gagal mengambil riwayat pesanan'
            });
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...transactions];

        if (activeTab !== 'all') {
            filtered = filtered.filter(t => t.status_transaksi === activeTab);
        }

        if (dateFilter.start) {
            const startDate = new Date(dateFilter.start);
            filtered = filtered.filter(t => new Date(t.created_at) >= startDate);
        }

        if (dateFilter.end) {
            const endDate = new Date(dateFilter.end);
            endDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(t => new Date(t.created_at) <= endDate);
        }

        setFilteredTransactions(filtered);
    };

    const filterByStatus = (status) => {
        setActiveTab(status);
    };

    const handleCancelOrder = async (transactionId) => {
        const result = await Swal.fire({
            title: 'Batalkan Pesanan?',
            text: 'Apakah Anda yakin ingin membatalkan pesanan ini?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, Batalkan',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('user_token');
                const response = await fetch(`/api/order-history/${transactionId}/cancel`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });

                const result = await response.json();

                if (result.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil',
                        text: 'Pesanan berhasil dibatalkan'
                    });
                    fetchOrderHistory();
                } else {
                    throw new Error(result.message || 'Gagal membatalkan pesanan');
                }
            } catch (error) {
                console.error('Error cancelling order:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: error.message || 'Gagal membatalkan pesanan'
                });
            }
        }
    };

    const handleUpdateStatus = async (transactionId, newStatus) => {
        const statusLabel = Object.entries(statusConfig).find(([key]) => key === newStatus)?.[1]?.label;

        const result = await Swal.fire({
            title: 'Ubah Status Pesanan?',
            html: `Ubah status menjadi <b>${statusLabel}</b>?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, Ubah',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('user_token');
                const response = await fetch(`/api/order-history/${transactionId}/update-status`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: newStatus })
                });

                const result = await response.json();

                if (result.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil',
                        text: 'Status pesanan berhasil diubah'
                    });
                    fetchOrderHistory();
                } else {
                    throw new Error(result.message || 'Gagal mengubah status pesanan');
                }
            } catch (error) {
                console.error('Error updating status:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: error.message || 'Gagal mengubah status pesanan'
                });
            }
        }
    };

    const viewTransactionDetail = (transaction) => {
        setSelectedTransaction(transaction);
        setShowDetailModal(true);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedTransaction(null);
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
            <span className={`${config.color} ${config.textColor} border ${config.borderColor} px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5`}>
                {config.icon}
                {config.label}
            </span>
        );
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

    const resetDateFilter = () => {
        setDateFilter({ start: '', end: '' });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <NavbarHome />
                <div className="fixed inset-0 bg-gray-50 flex flex-col items-center justify-center z-50">
                    <Loading />
                </div>
            </div>
        );
    }

    return (
        <>
            <NavbarHome />
            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-800 rounded-full mb-6">
                            <Package className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                            Riwayat Pesanan
                        </h1>
                        <p className="text-gray-600">Lihat semua transaksi pembelian Anda</p>
                    </div>

                    {/* Filters Section */}
                    <div className="mb-8 space-y-4">
                        {/* Status Filter */}
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-gray-600">
                                <Filter className="w-4 h-4" />
                                <span className="text-sm font-medium">Filter Status:</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${activeTab === 'all'
                                        ? 'bg-gray-800 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                        }`}
                                    onClick={() => filterByStatus('all')}
                                >
                                    Semua ({transactions.length})
                                </button>
                                {Object.entries(statusConfig).map(([status, config]) => {
                                    const count = transactions.filter(t => t.status_transaksi === status).length;
                                    return (
                                        <button
                                            key={status}
                                            className={`px-3 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${activeTab === status
                                                ? `${config.textColor} ${config.color} border ${config.borderColor}`
                                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                                                }`}
                                            onClick={() => filterByStatus(status)}
                                        >
                                            {config.icon}
                                            <span>{config.label}</span>
                                            {count > 0 && (
                                                <span className={`px-1.5 py-0.5 text-xs rounded-full ${activeTab === status ? 'bg-white/20' : 'bg-gray-100'}`}>
                                                    {count}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Date Filter */}
                        <div>
                            <button
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
                                onClick={() => setShowDateFilter(!showDateFilter)}
                            >
                                <CalendarDays className="w-4 h-4" />
                                <span className="text-sm font-medium">Filter Tanggal</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${showDateFilter ? 'rotate-180' : ''}`} />
                            </button>

                            {showDateFilter && (
                                <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Dari Tanggal
                                            </label>
                                            <input
                                                type="date"
                                                value={dateFilter.start}
                                                onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Sampai Tanggal
                                            </label>
                                            <input
                                                type="date"
                                                value={dateFilter.end}
                                                onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors flex items-center gap-2"
                                            onClick={applyFilters}
                                        >
                                            <Filter className="w-4 h-4" />
                                            Terapkan Filter
                                        </button>
                                        <button
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                                            onClick={resetDateFilter}
                                        >
                                            <X className="w-4 h-4" />
                                            Reset
                                        </button>
                                        {(dateFilter.start || dateFilter.end) && (
                                            <span className="text-sm text-gray-600 flex items-center gap-2 ml-auto">
                                                Filter aktif
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Transactions List */}
                    {filteredTransactions.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Package className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-3">Tidak ada pesanan</h3>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                {activeTab !== 'all' || dateFilter.start || dateFilter.end
                                    ? 'Tidak ada pesanan yang sesuai dengan filter Anda'
                                    : 'Mulai belanja sekarang dan lihat riwayat pesanan Anda di sini'}
                            </p>
                            {(activeTab !== 'all' || dateFilter.start || dateFilter.end) ? (
                                <button
                                    className="bg-gray-800 text-white px-6 py-2.5 rounded-md font-medium hover:bg-gray-700 transition-colors flex items-center gap-2 mx-auto"
                                    onClick={() => {
                                        setActiveTab('all');
                                        resetDateFilter();
                                    }}
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Reset Filter
                                </button>
                            ) : (
                                <button
                                    className="bg-gray-800 text-white px-6 py-2.5 rounded-md font-medium hover:bg-gray-700 transition-colors flex items-center gap-2 mx-auto"
                                    onClick={() => navigate('/buku')}
                                >
                                    <Home className="w-4 h-4" />
                                    Lihat Produk
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredTransactions.map((transaction) => (
                                <div key={transaction.transaksi_id} className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors overflow-hidden">
                                    {/* Transaction Header */}
                                    <div className="bg-gray-800 p-4 text-white">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div>
                                                <h3 className="font-medium flex items-center gap-2">
                                                    <span className="text-gray-300">Order ID:</span>
                                                    <span>{transaction.order_id}</span>
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1 text-sm text-gray-300">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>
                                                        {new Date(transaction.created_at).toLocaleDateString('id-ID', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                            {getStatusBadge(transaction.status_transaksi)}
                                        </div>
                                    </div>

                                    {/* Transaction Content */}
                                    <div className="p-4">
                                        {/* Summary Cards */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
                                            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                                <div className="flex items-center gap-2 text-gray-600 mb-1">
                                                    <Wallet className="w-3.5 h-3.5" />
                                                    <span className="text-xs font-medium">Total Harga</span>
                                                </div>
                                                <p className="text-lg font-semibold text-green-600">
                                                    {formatCurrency(transaction.total_harga)}
                                                </p>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                                <div className="flex items-center gap-2 text-gray-600 mb-1">
                                                    <DollarSign className="w-3.5 h-3.5" />
                                                    <span className="text-xs font-medium">Ongkir</span>
                                                </div>
                                                <p className="text-lg font-semibold text-blue-600">
                                                    {formatCurrency(transaction.ongkir || 0)}
                                                </p>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                                <div className="flex items-center gap-2 text-gray-600 mb-1">
                                                    <CreditCard className="w-3.5 h-3.5" />
                                                    <span className="text-xs font-medium">Pembayaran</span>
                                                </div>
                                                <p className="text-lg font-semibold text-gray-800">
                                                    {transaction.payment_method.toUpperCase()}
                                                </p>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                                <div className="flex items-center gap-2 text-gray-600 mb-1">
                                                    <Truck className="w-3.5 h-3.5" />
                                                    <span className="text-xs font-medium">Kurir</span>
                                                </div>
                                                <p className="text-lg font-semibold text-gray-800">
                                                    {transaction.kurir}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Items Preview */}
                                        <div className="mb-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <ShoppingBag className="w-4 h-4 text-gray-600" />
                                                <h4 className="font-medium text-gray-700">Daftar Barang</h4>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {transaction.items.slice(0, 3).map((item) => (
                                                    <div key={item.buku_id} className="flex gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                                                        <img
                                                            src={item.gambar}
                                                            alt={item.judul}
                                                            className="w-16 h-20 object-cover rounded border border-gray-300"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <h5 className="font-medium text-gray-800 truncate flex items-center gap-1">
                                                                <BookOpen className="w-3 h-3 shrink-0" />
                                                                <span className="truncate">{item.judul}</span>
                                                            </h5>
                                                            <p className="text-sm text-gray-600 truncate flex items-center gap-1 mt-1">
                                                                <User className="w-3 h-3 shrink-0" />
                                                                <span className="truncate">{item.penulis}</span>
                                                            </p>
                                                            <div className="flex items-center justify-between mt-2">
                                                                <span className="text-xs text-gray-500 font-medium">
                                                                    Qty: {formatNumber(item.jumlah)}
                                                                </span>
                                                                <span className="text-sm text-green-600 font-semibold">
                                                                    {formatCurrency(item.subtotal)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {transaction.items.length > 3 && (
                                                <p className="text-sm text-gray-500 mt-2">
                                                    +{formatNumber(transaction.items.length - 3)} item lainnya
                                                </p>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap gap-2 justify-between items-center pt-4 border-t border-gray-200">
                                            <div className="flex flex-wrap gap-2">
                                                {transaction.status_transaksi === 'transaksi-diproses' && (
                                                    <button
                                                        className="bg-red-50 text-red-700 px-4 py-2 rounded-md font-medium hover:bg-red-100 transition-colors flex items-center gap-2 border border-red-200"
                                                        onClick={() => handleCancelOrder(transaction.transaksi_id)}
                                                    >
                                                        <X className="w-4 h-4" />
                                                        Batalkan Pesanan
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {transaction.status_transaksi === 'transaksi-sukses' && (
                                                    <div className="relative group">
                                                        <button
                                                            className="bg-blue-50 text-blue-700 px-4 py-2 rounded-md font-medium hover:bg-blue-100 transition-colors flex items-center gap-2 border border-blue-200"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                            Ubah Status
                                                        </button>
                                                        <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-300 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                                            <div className="py-1">
                                                                {Object.entries(statusConfig)
                                                                    .filter(([status]) => status !== 'transaksi-sukses')
                                                                    .map(([status, config]) => (
                                                                        <button
                                                                            key={`status-option-${transaction.transaksi_id}-${status}`}
                                                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                                                            onClick={() => handleUpdateStatus(transaction.transaksi_id, status)}
                                                                        >
                                                                            {config.icon}
                                                                            {config.label}
                                                                        </button>
                                                                    ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <button
                                                    className="bg-gray-800 text-white px-5 py-2 rounded-md font-medium hover:bg-gray-700 transition-colors flex items-center gap-2"
                                                    onClick={() => viewTransactionDetail(transaction)}
                                                >
                                                    Lihat Detail
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Modal Order Detail */}
                {showDetailModal && selectedTransaction && (
                    <OrderDetailModal
                        transaction={selectedTransaction}
                        onClose={closeDetailModal}
                    />
                )}
            </div>
        </>
    );
}