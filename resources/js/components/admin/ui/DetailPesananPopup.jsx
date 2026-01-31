import { useState } from "react";
import Swal from "sweetalert2";

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

export default function DetailPesananPopup({ order, onClose }) {
    const formatRupiah = (angka) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(angka);
    };

    const getStatusColor = (status) => {
        const isExpired = order.status_transaksi === 'transaksi-kadaluarsa';
        const isPending = order.admin_action_status === 'pending';
        const isApproved = order.admin_action_status === 'approved';
        const isShipped = order.status_transaksi === 'pesanan-sedang-dikirim';
        const isRejected = order.admin_action_status === 'rejected';

        if (isExpired) return 'text-red-600';
        if (isPending) return 'text-yellow-600';
        if (isApproved) return 'text-green-600';
        if (isShipped) return 'text-blue-600';
        if (isRejected) return 'text-purple-600';
        return 'text-gray-600';
    };

    const getStatusText = () => {
        const isExpired = order.status_transaksi === 'transaksi-kadaluarsa';
        const isPending = order.admin_action_status === 'pending';
        const isApproved = order.admin_action_status === 'approved';
        const isShipped = order.status_transaksi === 'pesanan-sedang-dikirim';
        const isRejected = order.admin_action_status === 'rejected';

        if (isExpired) return 'Expired';
        if (isPending) return 'Menunggu';
        if (isApproved) return 'Diterima';
        if (isShipped) return 'Dikirim';
        if (isRejected) return 'Ditolak';
        return 'Tidak Diketahui';
    };

    const getPaymentStatus = () => {
        const paymentStatus = order.status_transaksi;
        const isPaid = paymentStatus === 'transaksi-sukses';
        const isUnpaid = paymentStatus === 'transaksi-diproses';
        const isExpired = order.status_transaksi === 'transaksi-kadaluarsa';
        const isShipped = order.status_transaksi === 'pesanan-sedang-dikirim';

        if (isExpired || isShipped) return null;
        
        return {
            text: isPaid ? 'Sudah Dibayar' : 'Belum Dibayar',
            color: isPaid ? 'text-green-600' : 'text-red-600'
        };
    };

    return (
        <div className="fixed inset-0 bg-gray-500/70 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-[#171717] p-6 text-white rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-semibold">Detail Pesanan</h3>
                            <p className="text-gray-300 text-sm mt-1">
                                Order ID: {order.transaction_id_midtrans || order.transaksi_id}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-300 text-2xl font-bold"
                        >
                            &times;
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto grow p-6">
                    {/* Status Section */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Status Pesanan</p>
                                <p className={`text-lg font-bold ${getStatusColor()}`}>
                                    {getStatusText()}
                                </p>
                            </div>
                            {getPaymentStatus() && (
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Status Pembayaran</p>
                                    <p className={`text-lg font-bold ${getPaymentStatus().color}`}>
                                        {getPaymentStatus().text}
                                    </p>
                                </div>
                            )}
                            {order.status_transaksi === 'pesanan-sedang-dikirim' && (
                                <div className="text-right">
                                    <p className="text-sm text-gray-600 mb-1">Nomor Resi</p>
                                    <p className="text-lg font-bold text-blue-600">
                                        {order.resi_pengiriman || 'N/A'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Customer Information */}
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Informasi Pelanggan</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Nama Lengkap</label>
                                <p className="text-sm text-gray-800 p-3 bg-gray-50 rounded-md border border-gray-200">
                                    {order.user?.name || 'Tidak Diketahui'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                                <p className="text-sm text-gray-800 p-3 bg-gray-50 rounded-md border border-gray-200">
                                    {order.user?.email || 'Tidak Diketahui'}
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Alamat Pengiriman</label>
                                <p className="text-sm text-gray-800 p-3 bg-gray-50 rounded-md border border-gray-200">
                                    {order.alamat_pengiriman || 'Tidak Diketahui'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Detail Pesanan</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Metode Pembayaran</label>
                                <p className="text-sm text-gray-800 p-3 bg-gray-50 rounded-md border border-gray-200">
                                    {order.payment_method || 'Tidak Diketahui'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Kurir Pengiriman</label>
                                <p className="text-sm text-gray-800 p-3 bg-gray-50 rounded-md border border-gray-200">
                                    {order.kurir || 'Tidak Diketahui'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Ongkos Kirim</label>
                                <p className="text-sm text-gray-800 p-3 bg-gray-50 rounded-md border border-gray-200">
                                    {formatRupiah(order.ongkir)}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Total Pembayaran</label>
                                <p className="text-sm text-gray-800 p-3 bg-gray-50 rounded-md border border-gray-200 font-bold ">
                                    {formatRupiah(order.total_harga)}
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Tanggal Pemesanan</label>
                                <p className="text-sm text-gray-800 p-3 bg-gray-50 rounded-md border border-gray-200">
                                    {new Date(order.created_at).toLocaleDateString('id-ID', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Daftar Barang</h4>
                        <div className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Buku</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Jumlah</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Harga Satuan</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {order.transaksi_detail?.length > 0 ? (
                                            order.transaksi_detail.map((detail, index) => (
                                                <tr key={detail.id || index} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <p className="text-sm font-medium text-gray-800">{detail.buku?.judul || 'Buku Tidak Dikenal'}</p>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <p className="text-sm text-gray-600">{detail.jumlah}</p>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <p className="text-sm text-gray-600">{formatRupiah(detail.harga_satuan)}</p>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <p className="text-sm font-semibold text-gray-800">{formatRupiah(detail.harga_satuan * detail.jumlah)}</p>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="px-4 py-8 text-center text-sm text-gray-500">
                                                    Tidak ada detail barang.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {order.status_transaksi === 'pesanan-sedang-dikirim' && (
                        <div className="mb-6">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4">Informasi Pengiriman</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Nomor Resi</label>
                                    <p className="text-sm text-gray-800 p-3 bg-gray-50 rounded-md border border-gray-200 font-semibold">
                                        {order.resi_pengiriman || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Tanggal Dikirim</label>
                                    <p className="text-sm text-gray-800 p-3 bg-gray-50 rounded-md border border-gray-200">
                                        {order.tanggal_dikirim ? 
                                            new Date(order.tanggal_dikirim).toLocaleDateString('id-ID', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) : 'N/A'
                                        }
                                    </p>
                                </div>
                                {order.catatan_pengiriman && (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Catatan Pengiriman</label>
                                        <p className="text-sm text-gray-800 p-3 bg-gray-50 rounded-md border border-gray-200">
                                            {order.catatan_pengiriman}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-white rounded-b-lg">
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="cursor-pointer px-6 py-2.5 bg-[#171717] text-white rounded-md font-medium hover:bg-gray-900 transition-colors"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}