import { useState, useEffect } from "react";
import Sidebar from "./ui/Sidebar";
import Swal from "sweetalert2";
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';

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

const COLORS = {
    primary: '#171717',
    yellow: '#FFD700',
    green: '#10B981',
    blue: '#3B82F6',
    purple: '#8B5CF6',
    red: '#EF4444',
    gray: '#6B7280'
};

export default function Dashboard() {
    document.title = "Dashboard - Lobaca Admin";
    
    const [totalPendapatan, setTotalPendapatan] = useState(0);
    const [totalBukuTerjual, setTotalBukuTerjual] = useState(0);
    const [loading, setLoading] = useState(true);
    const [timeRangeFilter, setTimeRangeFilter] = useState('monthly');
    const [chartData, setChartData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [chartLoading, setChartLoading] = useState(true);
    const [ordersToday, setOrdersToday] = useState(0); // State untuk pesanan hari ini
    const [ordersTodayLoading, setOrdersTodayLoading] = useState(true);

    useEffect(() => {
        fetchTotalPendapatan();
        fetchChartData();
        fetchRecentOrders();
        fetchOrdersToday(); // Panggil saat komponen mount
    }, [timeRangeFilter]);

    // Auto-refresh setiap 30 detik untuk pesanan hari ini
    useEffect(() => {
        const interval = setInterval(fetchOrdersToday, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchTotalPendapatan = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                Toast.fire({ icon: "error", title: "Admin belum login." });
                return;
            }

            let queryParams = [];
            if (timeRangeFilter) queryParams.push(`time_range=${timeRangeFilter}`);
            const queryString = queryParams.length > 0 ? '?' + queryParams.join('&') : '';

            const res = await fetch(`/api/admin/orders${queryString}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setTotalPendapatan(data.total_pendapatan || 0);
                setTotalBukuTerjual(data.total_buku_terjual || 0);
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

    const fetchChartData = async () => {
        setChartLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                Toast.fire({ icon: "error", title: "Admin belum login." });
                return;
            }

            let queryParams = [];
            if (timeRangeFilter) queryParams.push(`time_range=${timeRangeFilter}`);
            const queryString = queryParams.length > 0 ? '?' + queryParams.join('&') : '';

            const res = await fetch(`/api/admin/dashboard/stats${queryString}`, { 
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setChartData(data.revenue_chart || []);
                setStatusData(data.status_chart || []);
            } else {
                const error = await res.json().catch(() => ({ message: "Gagal memuat data chart." }));
                Toast.fire({ icon: "error", title: error.message || "Gagal memuat data chart." });
                console.error("Chart API error:", error);
            }
        } catch (error) {
            console.error("Fetch chart error:", error);
            Toast.fire({ icon: "error", title: "Kesalahan jaringan chart." });
        } finally {
            setChartLoading(false);
        }
    };

    const fetchRecentOrders = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) return;

            const res = await fetch('/api/admin/orders?status=pending', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                
                const activePendingOrders = (data.data || []).filter(order => 
                    order.status_transaksi !== 'transaksi-kadaluarsa' &&
                    ['transaksi-diproses', 'transaksi-sukses'].includes(order.status_transaksi)
                );
                setRecentOrders(activePendingOrders.slice(0, 5)); 
            }
        } catch (error) {
            console.error("Fetch recent orders error:", error);
        }
    };

    // ====== FUNGSI BARU: Fetch jumlah pesanan hari ini ======
    const fetchOrdersToday = async () => {
        setOrdersTodayLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                Toast.fire({ icon: "error", title: "Admin belum login." });
                setOrdersTodayLoading(false);
                return;
            }

            const res = await fetch('/api/admin/orders/count-today', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setOrdersToday(data.count || 0);
                } else {
                    setOrdersToday(0);
                }
            } else {
                const error = await res.json().catch(() => ({ message: "Gagal memuat data pesanan hari ini." }));
                console.error("Orders today API error:", error);
                setOrdersToday(0);
            }
        } catch (error) {
            console.error("Fetch orders today error:", error);
            setOrdersToday(0);
        } finally {
            setOrdersTodayLoading(false);
        }
    };

    const formatRupiah = (angka) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(angka);
    };

    const getTimeRangeLabel = () => {
        switch (timeRangeFilter) {
            case 'daily': return 'Hari Ini';
            case 'weekly': return 'Minggu Ini';
            case 'monthly': return 'Bulan Ini';
            case 'yearly': return 'Tahun Ini';
            default: return 'Semua Waktu';
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'pending': { text: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
            'approved': { text: 'Approved', color: 'bg-green-100 text-green-800' },
            'shipped': { text: 'Shipped', color: 'bg-blue-100 text-blue-800' },
            'rejected': { text: 'Rejected', color: 'bg-red-100 text-red-800' },
            'default': { text: 'Unknown', color: 'bg-gray-100 text-gray-800' }
        };
        return badges[status] || badges['default'];
    };

    const getXAxisDataKey = () => {
        switch (timeRangeFilter) {
            case 'daily': return 'hour';
            case 'weekly': return 'day_name';
            case 'monthly': return 'day';
            case 'yearly': return 'month';
            default: return 'day';
        }
    };

    const getLabelFormatter = (label) => {
        switch (timeRangeFilter) {
            case 'daily': return `Jam ${label}:00`;
            case 'weekly': return `Hari: ${label}`;
            case 'monthly': return `Tanggal ${label}`;
            case 'yearly': return `Bulan: ${label}`;
            default: return label;
        }
    };

    return (
        <Sidebar>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Dashboard Admin
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Selamat datang di panel kontrol Lobaca
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-600">
                            <span>📅</span> {new Date().toLocaleDateString('id-ID', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Pendapatan */}
                    <div className="bg-linear-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-100 mb-1">Total Pendapatan</p>
                                <p className="text-3xl font-bold">{loading ? '...' : formatRupiah(totalPendapatan)}</p>
                                <p className="text-xs text-green-100 mt-1">Periode: {getTimeRangeLabel()}</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-full">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Buku Terjual */}
                    <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-purple-100 mb-1">Buku Terjual</p>
                                <p className="text-3xl font-bold">{loading ? '...' : totalBukuTerjual.toLocaleString('id-ID')}</p>
                                <p className="text-xs text-purple-100 mt-1">Total semua waktu</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-full">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Pesanan Pending */}
                    <div className="bg-linear-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-yellow-100 mb-1">Pesanan Pending</p>
                                <p className="text-3xl font-bold">{recentOrders.length}</p>
                                <p className="text-xs text-yellow-100 mt-1">Menunggu konfirmasi</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-full">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Pesanan Hari Ini - DIPERBAIKI */}
                    <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-100 mb-1">Pesanan Hari Ini</p>
                                <p className="text-3xl font-bold">
                                    {ordersTodayLoading ? '...' : ordersToday.toLocaleString('id-ID')}
                                </p>
                                <p className="text-xs text-blue-100 mt-1">Total transaksi hari ini</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-full">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Chart */}
                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-700">Pendapatan</h2>
                            <select
                                value={timeRangeFilter}
                                onChange={(e) => setTimeRangeFilter(e.target.value)}
                                className="p-2 border border-gray-300 rounded-md text-sm focus:ring-yellow-500 focus:border-yellow-500"
                            >
                                <option value="daily">Harian</option>
                                <option value="weekly">Mingguan</option>
                                <option value="monthly">Bulanan</option>
                                <option value="yearly">Tahunan</option>
                            </select>
                        </div>
                        <div className="h-80 w-full">
                            {chartLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                                </div>
                            ) : chartData.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-gray-500">Tidak ada data untuk periode ini</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor={COLORS.green} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis 
                                            dataKey={getXAxisDataKey()} 
                                            stroke="#888888" 
                                            fontSize={12} 
                                        />
                                        <YAxis 
                                            stroke="#888888" 
                                            fontSize={12} 
                                            tickFormatter={(value) => `Rp${(value/1000000).toFixed(0)}jt`} 
                                        />
                                        <Tooltip 
                                            formatter={(value, name) => {
                                                if (name === 'revenue') return [formatRupiah(value), 'Pendapatan'];
                                                if (name === 'books') return [`${value} buku`, 'Jumlah Buku'];
                                                return [value, name];
                                            }}
                                            labelFormatter={(label) => getLabelFormatter(label)}
                                            contentStyle={{ 
                                                backgroundColor: 'rgba(255,255,255,0.95)', 
                                                border: '1px solid #e5e7eb', 
                                                borderRadius: '8px',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <Legend />
                                        <Area 
                                            type="monotone" 
                                            dataKey="revenue" 
                                            stroke={COLORS.green} 
                                            fillOpacity={1} 
                                            fill="url(#colorRevenue)"
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Status Pie Chart */}
                    <div className="bg-white rounded-xl shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">Distribusi Status Pesanan</h2>
                        <div className="h-80 w-full flex items-center justify-center">
                            {chartLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                </div>
                            ) : statusData.length === 0 ? (
                                <p className="text-gray-500">Tidak ada data status</p>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={2}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            labelLine={false}
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value, name) => [`${value} pesanan`, name]}
                                            contentStyle={{ 
                                                backgroundColor: 'rgba(255,255,255,0.95)', 
                                                border: '1px solid #e5e7eb', 
                                                borderRadius: '8px',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <Legend 
                                            verticalAlign="bottom"
                                            height={36}
                                            formatter={(value) => (
                                                <span className="text-sm text-gray-700">{value}</span>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-700">Pesanan Pending</h2>
                        <a href="/admin/pesanan" className="text-sm text-yellow-600 hover:text-yellow-700 font-medium">
                            Lihat Semua →
                        </a>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pelanggan</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {recentOrders.map((order) => (
                                    <tr key={order.transaksi_id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {order.transaction_id_midtrans || `LOB-${order.transaksi_id}`}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                            {order.user?.name || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-semibold">
                                            {formatRupiah(order.total_harga)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(order.admin_action_status).color}`}>
                                                {getStatusBadge(order.admin_action_status).text}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(order.created_at).toLocaleDateString('id-ID', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                    </tr>
                                ))}
                                {recentOrders.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">
                                            Tidak ada pesanan pending.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Sidebar>
    );
}