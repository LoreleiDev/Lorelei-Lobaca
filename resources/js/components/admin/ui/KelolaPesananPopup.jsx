import { useState } from "react";
import Swal from "sweetalert2";

function getLocalISOString(date) {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60000));
    return localDate.toISOString().split('T')[0];
}

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

export default function AturPesananPopup({ order, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        resi: "",
        tanggal_dikirim: "",
        catatan: ""
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.resi.trim()) {
            Toast.fire({ icon: "warning", title: "Nomor resi harus diisi." });
            return;
        }

        if (!formData.tanggal_dikirim) {
            Toast.fire({ icon: "warning", title: "Tanggal pengiriman harus diisi." });
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                Toast.fire({ icon: "error", title: "Admin belum login." });
                return;
            }

            const res = await fetch(`/api/admin/orders/${order.transaksi_id}/update-shipping`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    resi: formData.resi,
                    tanggal_dikirim: formData.tanggal_dikirim,
                    catatan: formData.catatan,
                    status: 'dikirim'
                })
            });

            if (res.ok) {
                const result = await res.json();
                Toast.fire({
                    icon: "success",
                    title: result.message || "Pengiriman berhasil diperbarui."
                });
                onSuccess();
                onClose();
            } else {
                const errorData = await res.json().catch(() => ({ message: "Gagal memperbarui data." }));
                Toast.fire({ icon: "error", title: errorData.message || "Gagal memperbarui data." });
            }
        } catch (error) {
            console.error("Update shipping error:", error);
            Toast.fire({ icon: "error", title: "Kesalahan jaringan." });
        } finally {
            setLoading(false);
        }
    };

    const formatRupiah = (angka) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(angka);
    };

    return (
        <div className="fixed inset-0 bg-gray-500/70 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-linear-to-r bg-[#171717] p-6 text-white rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-semibold">Atur Pengiriman Pesanan</h3>
                            <p className="text-blue-100 text-sm mt-1">
                                Order ID: {order.transaction_id_midtrans || order.transaksi_id}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-blue-200 text-2xl font-bold"
                        >
                            &times;
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto grow">
                    {/* Order Summary */}
                    <div className="p-6 border-b border-gray-200 rounded-b-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Informasi Pelanggan</h4>
                                <div className="space-y-1 text-sm">
                                    <p><span className="text-gray-600">Nama:</span> {order.user?.name}</p>
                                    <p><span className="text-gray-600">Email:</span> {order.user?.email}</p>
                                    <p><span className="text-gray-600">Alamat:</span> {order.alamat_pengiriman}</p>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Detail Pesanan</h4>
                                <div className="space-y-1 text-sm">
                                    <p><span className="text-gray-600">Kurir:</span> {order.kurir}</p>
                                    <p><span className="text-gray-600">Ongkir:</span> {formatRupiah(order.ongkir)}</p>
                                    <p><span className="text-gray-600">Total:</span> {formatRupiah(order.total_harga)}</p>
                                    <p><span className="text-gray-600">Tanggal:</span> {new Date(order.created_at).toLocaleDateString('id-ID', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}</p>
                                </div>
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Daftar Barang</h4>
                            <div className="bg-gray-50 rounded-md border border-gray-200 p-3 max-h-40 overflow-y-auto">
                                {order.transaksi_detail?.length > 0 ? (
                                    order.transaksi_detail.map((detail) => (
                                        <div key={detail.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                                            <div>
                                                <p className="text-sm text-gray-800">{detail.buku?.judul || 'Buku Tidak Dikenal'}</p>
                                                <p className="text-xs text-gray-500">Jumlah: {detail.jumlah}</p>
                                            </div>
                                            <p className="text-sm font-medium text-gray-800">
                                                {formatRupiah(detail.harga_satuan * detail.jumlah)}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 italic">Tidak ada detail barang.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 mt-0 rounded-lg">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nomor Resi <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.resi}
                                    onChange={(e) => setFormData({ ...formData, resi: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Masukkan nomor resi pengiriman"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Pastikan nomor resi sesuai dengan yang diberikan oleh kurir
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tanggal Dikirim <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.tanggal_dikirim}
                                    onChange={(e) => setFormData({ ...formData, tanggal_dikirim: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                    max={getLocalISOString(new Date())}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Tanggal barang dikirimkan ke pelanggan
                                </p>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-gray-200 bg-white rounded-b-lg">
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="cursor-pointer px-5 py-2.5 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="cursor-pointer px-5 py-2.5 bg-[#171717] text-white rounded-md font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Menyimpan...
                                </>
                            ) : (
                                'Simpan Pengiriman'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}