import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
    Bell,
    BellRing,
    CheckCircle,
    XCircle,
    AlertCircle,
    Package,
    ShoppingBag,
    CreditCard,
    Truck,
    Calendar,
    Clock,
    ChevronRight,
    Filter,
    Check,
    X,
    Trash2,
    Eye,
    EyeOff
} from 'lucide-react';

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [filteredNotifications, setFilteredNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);

    const notificationTypes = {
        'order_processed': {
            title: 'Pesanan Diproses',
            description: 'Pesanan Anda sedang diproses',
            color: 'bg-blue-50',
            textColor: 'text-blue-700',
            borderColor: 'border-blue-200',
            icon: <Package className="w-5 h-5" />
        },
        'order_success': {
            title: 'Pesanan Berhasil',
            description: 'Pesanan Anda telah berhasil',
            color: 'bg-green-50',
            textColor: 'text-green-700',
            borderColor: 'border-green-200',
            icon: <CheckCircle className="w-5 h-5" />
        },
        'order_cancelled': {
            title: 'Pesanan Dibatalkan',
            description: 'Pesanan Anda telah dibatalkan',
            color: 'bg-red-50',
            textColor: 'text-red-700',
            borderColor: 'border-red-200',
            icon: <XCircle className="w-5 h-5" />
        },
        'payment_success': {
            title: 'Pembayaran Berhasil',
            description: 'Pembayaran Anda telah berhasil',
            color: 'bg-emerald-50',
            textColor: 'text-emerald-700',
            borderColor: 'border-emerald-200',
            icon: <CreditCard className="w-5 h-5" />
        },
        'payment_failed': {
            title: 'Pembayaran Gagal',
            description: 'Pembayaran Anda gagal',
            color: 'bg-amber-50',
            textColor: 'text-amber-700',
            borderColor: 'border-amber-200',
            icon: <AlertCircle className="w-5 h-5" />
        },
        'shipping_update': {
            title: 'Update Pengiriman',
            description: 'Status pengiriman telah diperbarui',
            color: 'bg-purple-50',
            textColor: 'text-purple-700',
            borderColor: 'border-purple-200',
            icon: <Truck className="w-5 h-5" />
        },
        'order_expired': {
            title: 'Pesanan Kadaluarsa',
            description: 'Pesanan Anda telah kadaluarsa',
            color: 'bg-gray-50',
            textColor: 'text-gray-700',
            borderColor: 'border-gray-200',
            icon: <Clock className="w-5 h-5" />
        }
    };

    // Data contoh notifikasi (dummy data)
    const dummyNotifications = [
        {
            id: 1,
            type: 'order_success',
            title: 'Pesanan Berhasil',
            message: 'Pesanan #LOBACA-1769475524-3 telah berhasil diproses dan akan segera dikirim.',
            orderId: 'LOBACA-1769475524-3',
            date: '2026-01-27T07:58:00Z',
            isRead: false,
            data: { total: 68000 }
        },
        {
            id: 2,
            type: 'payment_success',
            title: 'Pembayaran Berhasil',
            message: 'Pembayaran untuk pesanan #LOBACA-1769475524-3 sebesar Rp 68.000 telah berhasil.',
            orderId: 'LOBACA-1769475524-3',
            date: '2026-01-27T07:55:00Z',
            isRead: false,
            data: { amount: 68000 }
        },
        {
            id: 3,
            type: 'order_processed',
            title: 'Pesanan Diproses',
            message: 'Pesanan #LOBACA-1769475524-3 sedang diproses oleh penjual.',
            orderId: 'LOBACA-1769475524-3',
            date: '2026-01-27T07:50:00Z',
            isRead: true,
            data: {}
        },
        {
            id: 4,
            type: 'shipping_update',
            title: 'Update Pengiriman',
            message: 'Pesanan #LOBACA-1769475524-3 sedang dalam pengiriman dengan kurir JNE.',
            orderId: 'LOBACA-1769475524-3',
            date: '2026-01-26T14:30:00Z',
            isRead: true,
            data: { courier: 'JNE' }
        },
        {
            id: 5,
            type: 'order_cancelled',
            title: 'Pesanan Dibatalkan',
            message: 'Pesanan #LOBACA-1769475524-1 telah dibatalkan.',
            orderId: 'LOBACA-1769475524-1',
            date: '2026-01-25T10:15:00Z',
            isRead: true,
            data: {}
        },
        {
            id: 6,
            type: 'payment_failed',
            title: 'Pembayaran Gagal',
            message: 'Pembayaran untuk pesanan #LOBACA-1769475524-2 gagal. Silakan coba lagi.',
            orderId: 'LOBACA-1769475524-2',
            date: '2026-01-24T16:45:00Z',
            isRead: true,
            data: {}
        },
        {
            id: 7,
            type: 'order_expired',
            title: 'Pesanan Kadaluarsa',
            message: 'Pesanan #LOBACA-1769475524-4 telah kadaluarsa karena tidak melakukan pembayaran.',
            orderId: 'LOBACA-1769475524-4',
            date: '2026-01-23T09:20:00Z',
            isRead: true,
            data: {}
        }
    ];

    useEffect(() => {
        // Simulasi fetch notifikasi
        setTimeout(() => {
            setNotifications(dummyNotifications);
            setFilteredNotifications(dummyNotifications);
            setLoading(false);
        }, 1000);
    }, []);

    useEffect(() => {
        applyFilters();
    }, [activeFilter, showUnreadOnly, notifications]);

    const applyFilters = () => {
        let filtered = [...notifications];

        // Filter by type
        if (activeFilter !== 'all') {
            filtered = filtered.filter(n => n.type === activeFilter);
        }

        // Filter unread only
        if (showUnreadOnly) {
            filtered = filtered.filter(n => !n.isRead);
        }

        // Sort by date (newest first)
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setFilteredNotifications(filtered);
    };

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => 
            n.id === id ? { ...n, isRead: true } : n
        ));
    };

    const markAllAsRead = () => {
        Swal.fire({
            title: 'Tandai Semua Dibaca?',
            text: 'Semua notifikasi akan ditandai sebagai sudah dibaca.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, Tandai Semua',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Semua notifikasi telah ditandai dibaca'
                });
            }
        });
    };

    const deleteNotification = (id) => {
        Swal.fire({
            title: 'Hapus Notifikasi?',
            text: 'Notifikasi ini akan dihapus secara permanen.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                setNotifications(prev => prev.filter(n => n.id !== id));
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Notifikasi telah dihapus'
                });
            }
        });
    };

    const deleteAllRead = () => {
        const readCount = notifications.filter(n => n.isRead).length;
        if (readCount === 0) {
            Swal.fire({
                icon: 'info',
                title: 'Tidak Ada Notifikasi',
                text: 'Tidak ada notifikasi yang sudah dibaca untuk dihapus'
            });
            return;
        }

        Swal.fire({
            title: 'Hapus Semua Notifikasi Dibaca?',
            text: `${readCount} notifikasi yang sudah dibaca akan dihapus.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, Hapus Semua',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                setNotifications(prev => prev.filter(n => !n.isRead));
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Semua notifikasi yang sudah dibaca telah dihapus'
                });
            }
        });
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const getNotificationConfig = (type) => {
        return notificationTypes[type] || {
            title: 'Notifikasi',
            description: 'Pemberitahuan',
            color: 'bg-gray-50',
            textColor: 'text-gray-700',
            borderColor: 'border-gray-200',
            icon: <Bell className="w-5 h-5" />
        };
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 60) {
            return `${diffMins} menit yang lalu`;
        } else if (diffHours < 24) {
            return `${diffHours} jam yang lalu`;
        } else if (diffDays === 1) {
            return 'Kemarin';
        } else if (diffDays < 7) {
            return `${diffDays} hari yang lalu`;
        } else {
            return date.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="animate-pulse flex flex-col items-center justify-center min-h-96">
                        <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-800 rounded-full mb-6 relative">
                        <Bell className="w-10 h-10 text-white" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                        Notifikasi
                    </h1>
                    <p className="text-gray-600">Kelola semua pemberitahuan Anda di satu tempat</p>
                </div>

                {/* Stats and Actions */}
                <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
                            <span className="text-sm text-gray-600">Total: </span>
                            <span className="font-semibold text-gray-800">{notifications.length}</span>
                        </div>
                        <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                            <span className="text-sm text-blue-600">Belum Dibaca: </span>
                            <span className="font-semibold text-blue-700">{unreadCount}</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        <button
                            className="bg-gray-800 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm"
                            onClick={markAllAsRead}
                            disabled={unreadCount === 0}
                        >
                            <Check className="w-4 h-4" />
                            Tandai Semua Dibaca
                        </button>
                        <button
                            className="bg-red-50 text-red-700 px-4 py-2 rounded-md font-medium hover:bg-red-100 transition-colors flex items-center gap-2 text-sm border border-red-200"
                            onClick={deleteAllRead}
                        >
                            <Trash2 className="w-4 h-4" />
                            Hapus Semua Dibaca
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-8 space-y-4">
                    <div className="flex items-center gap-2 text-gray-600">
                        <Filter className="w-4 h-4" />
                        <span className="text-sm font-medium">Filter:</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        <button
                            className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${activeFilter === 'all'
                                ? 'bg-gray-800 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                }`}
                            onClick={() => setActiveFilter('all')}
                        >
                            Semua
                        </button>
                        
                        {Object.entries(notificationTypes).map(([type, config]) => {
                            const count = notifications.filter(n => n.type === type).length;
                            if (count === 0) return null;
                            
                            return (
                                <button
                                    key={type}
                                    className={`px-3 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${activeFilter === type
                                        ? `${config.textColor} ${config.color} border ${config.borderColor}`
                                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                                        }`}
                                    onClick={() => setActiveFilter(type)}
                                >
                                    {config.icon}
                                    <span>{config.title}</span>
                                    <span className={`px-1.5 py-0.5 text-xs rounded-full ${activeFilter === type ? 'bg-white/20' : 'bg-gray-100'}`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-colors ${showUnreadOnly
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                                }`}
                            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                        >
                            {showUnreadOnly ? (
                                <>
                                    <EyeOff className="w-4 h-4" />
                                    Sembunyikan Belum Dibaca
                                </>
                            ) : (
                                <>
                                    <Eye className="w-4 h-4" />
                                    Tampilkan Belum Dibaca
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Notifications List */}
                {filteredNotifications.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BellRing className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-3">Tidak ada notifikasi</h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            {activeFilter !== 'all' || showUnreadOnly
                                ? 'Tidak ada notifikasi yang sesuai dengan filter Anda'
                                : 'Semua pemberitahuan akan muncul di sini'}
                        </p>
                        {(activeFilter !== 'all' || showUnreadOnly) && (
                            <button
                                className="bg-gray-800 text-white px-6 py-2.5 rounded-md font-medium hover:bg-gray-700 transition-colors flex items-center gap-2 mx-auto"
                                onClick={() => {
                                    setActiveFilter('all');
                                    setShowUnreadOnly(false);
                                }}
                            >
                                Reset Filter
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredNotifications.map((notification) => {
                            const config = getNotificationConfig(notification.type);
                            
                            return (
                                <div 
                                    key={notification.id} 
                                    className={`bg-white rounded-lg border ${notification.isRead ? 'border-gray-200' : 'border-blue-300 border-2'} hover:border-gray-300 transition-colors overflow-hidden`}
                                >
                                    {/* Notification Header */}
                                    <div className={`p-4 ${notification.isRead ? 'bg-white' : 'bg-blue-50'}`}>
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className={`p-2 rounded-lg ${config.color} ${config.textColor}`}>
                                                    {config.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div>
                                                            <h3 className="font-semibold text-gray-800">
                                                                {notification.title}
                                                            </h3>
                                                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                                                                <Calendar className="w-3 h-3" />
                                                                <span>{formatDate(notification.date)}</span>
                                                            </div>
                                                        </div>
                                                        {!notification.isRead && (
                                                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
                                                                Baru
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    <p className="text-gray-700 mt-2">
                                                        {notification.message}
                                                    </p>
                                                    
                                                    {notification.orderId && (
                                                        <div className="mt-3">
                                                            <span className="text-sm text-gray-600 font-medium">
                                                                Order ID: 
                                                            </span>
                                                            <span className="text-sm text-gray-800 ml-2 font-semibold">
                                                                {notification.orderId}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Notification Actions */}
                                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Clock className="w-3 h-3" />
                                                <span>
                                                    {new Date(notification.date).toLocaleDateString('id-ID', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                {!notification.isRead && (
                                                    <button
                                                        className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-2 border border-blue-200"
                                                        onClick={() => markAsRead(notification.id)}
                                                    >
                                                        <Check className="w-3 h-3" />
                                                        Tandai Dibaca
                                                    </button>
                                                )}
                                                <button
                                                    className="bg-red-50 text-red-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-2 border border-red-200"
                                                    onClick={() => deleteNotification(notification.id)}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};