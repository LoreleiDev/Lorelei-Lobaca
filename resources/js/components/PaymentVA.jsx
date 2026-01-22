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

export default function PaymentVa() {
    const location = useLocation();
    const navigate = useNavigate();
    const { vaNumbers, orderId, grossAmount, paymentMethod, billKey, billerCode } = location.state || {};

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

                    // Prioritas 1: Jika admin tolak → gagal
                    if (adminAction === 'rejected') {
                        setPaymentStatus('failed');
                        return;
                    }

                    // Prioritas 2: Cek status transaksi
                    if (status === 'transaksi-sukses' || status === 'transaksi-diterima') {
                        setPaymentStatus('success');
                    }
                    // Tambahkan 'transaksi-dibatalkan' ke daftar status gagal
                    else if (
                        status === 'transaksi-kadaluarsa' ||
                        status === 'transaksi-ditolak' ||
                        status === 'transaksi-dibatalkan' // ⬅️ TAMBAHKAN INI
                    ) {
                        setPaymentStatus('failed');
                    }
                }
            } catch (error) {
                console.error("Polling error:", error);
            }
        };
        const intervalId = setInterval(pollStatus, 5000); // Polling setiap 15 detik
        pollStatus(); // Panggil sekali saat mount
        return () => clearInterval(intervalId);
    }, [orderId]);

    // Tambahkan kondisi early return jika orderId tidak valid
    if (!orderId || !paymentMethod) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-yellow-50">
                <p className="text-yellow-800 text-lg font-medium">Memuat...</p>
            </div>
        );
    }

    // Fungsi untuk menentukan nama bank
    const getBankName = () => {
        if (paymentMethod.includes('bca')) return 'BCA';
        if (paymentMethod.includes('bni')) return 'BNI';
        if (paymentMethod.includes('bri')) return 'BRI';
        if (paymentMethod.includes('mandiri')) return 'Mandiri';
        if (paymentMethod.includes('permata')) return 'Permata';
        return 'Bank';
    };

    const bankName = getBankName();
    const isMandiriBill = paymentMethod.includes('mandiri') && billKey && billerCode;
    const isPermata = paymentMethod.includes('permata');

    // Ambil nomor VA
    let vaNumber = '';
    if (isMandiriBill) {
        vaNumber = `${billerCode}${billKey}`;
    } else if (isPermata && Array.isArray(vaNumbers) && vaNumbers[0]?.va_number) {
        vaNumber = vaNumbers[0].va_number;
    } else if (Array.isArray(vaNumbers) && vaNumbers[0]?.va_number) {
        vaNumber = vaNumbers[0].va_number;
    } else if (typeof vaNumbers === 'string') {
        vaNumber = vaNumbers;
    }


    // SUCCESS SCREEN
    if (paymentStatus === 'success') {
        return (
            <div className="min-h-screen bg-linear-to-b from-yellow-50 to-yellow-100 py-8 px-4">
                <div className="max-w-md mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-yellow-300">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Pembayaran Berhasil!</h2>
                        <p className="text-gray-600 mb-6">
                            Terima kasih! Pembayaran untuk pesanan <span className="font-mono font-bold text-yellow-700"><br />{orderId} <br /></span> telah diterima.
                        </p>
                        <Button
                            onClick={() => navigate('/transaksi')}
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                            Lihat Detail Transaksi
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // FAILED SCREEN
    if (paymentStatus === 'failed') {
        return (
            <div className="min-h-screen bg-linear-to-b from-yellow-50 to-yellow-100 py-8 px-4">
                <div className="max-w-md mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-yellow-300">
                        <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Pembayaran Gagal</h2>
                        <p className="text-gray-600 mb-6">
                            Waktu pembayaran untuk pesanan <span className="font-mono font-bold text-yellow-700"><br />{orderId} <br /></span> telah habis atau dibatalkan.
                        </p>
                        <Button
                            onClick={() => navigate('/cart')}
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                            Kembali ke Keranjang
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // PENDING SCREEN (Default)
    return (
        <div className="min-h-screen bg-linear-to-b from-yellow-50 to-yellow-100 py-8 px-4">
            <div className="max-w-md mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-yellow-300">
                    <div className="bg-yellow-500 py-5 text-center">
                        <h1 className="text-2xl font-bold text-white tracking-wide">
                            {isMandiriBill ? 'Bayar via Mandiri Bill' : 'Bayar via Virtual Account'}
                        </h1>
                    </div>

                    <div className="p-6">
                        <div className="text-center mb-6">
                            <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Order ID</p>
                            <p className="font-mono text-lg font-bold text-yellow-700 mt-1">{orderId}</p>
                        </div>

                        <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg p-4 mb-6">
                            <p className="font-bold text-yellow-800 mb-2">Detail Pembayaran:</p>
                            <div className="text-sm text-gray-700 space-y-1">
                                <p><span className="font-semibold">Bank:</span> {bankName}</p>
                                {!isMandiriBill && (
                                    <p><span className="font-semibold">Nomor VA:</span> <strong>{vaNumber}</strong></p>
                                )}
                                {isMandiriBill && (
                                    <>
                                        <p><span className="font-semibold">Biller Code:</span> <strong>{billerCode}</strong></p>
                                        <p><span className="font-semibold">Bill Key:</span> <strong>{billKey}</strong></p>
                                    </>
                                )}
                                <p><span className="font-semibold">Jumlah:</span> <strong>IDR {new Intl.NumberFormat('id-ID').format(grossAmount)}</strong></p>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg p-4 mb-6">
                            <p className="font-bold text-yellow-800 mb-2">Instruksi Pembayaran:</p>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 pl-2">
                                {isMandiriBill ? (
                                    <>
                                        <li>Buka aplikasi mobile banking Mandiri atau kunjungi ATM Mandiri.</li>
                                        <li>Pilih menu <strong>Bayar</strong> → <strong>Lainnya</strong> → <strong>Mandiri Bill</strong>.</li>
                                        <li>Masukkan <strong>Biller Code ({billerCode})</strong> dan <strong>Bill Key ({billKey})</strong>.</li>
                                        <li>Periksa detail pembayaran dan konfirmasi.</li>
                                    </>
                                ) : (
                                    <>
                                        <li>Buka aplikasi mobile banking atau ATM dari bank {bankName}.</li>
                                        <li>Pilih menu <strong>Transfer</strong>.</li>
                                        <li>Masukkan <strong>Nomor VA ({vaNumber})</strong> sebagai nomor rekening tujuan.</li>
                                        <li>Masukkan <strong>Jumlah Pembayaran (IDR {new Intl.NumberFormat('id-ID').format(grossAmount)})</strong> secara <strong>eksak</strong>.</li>
                                        <li>Lanjutkan proses transfer hingga selesai.</li>
                                    </>
                                )}
                            </ol>
                        </div>

                        {isMandiriBill && (
                            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4 mb-6">
                                <p className="font-bold text-blue-800 mb-2">Informasi Mandiri Bill:</p>
                                <div className="text-sm text-gray-700 space-y-1">
                                    <p><span className="font-semibold">Bill Key:</span> <strong>{billKey}</strong></p>
                                    <p><span className="font-semibold">Biller Code:</span> <strong>{billerCode}</strong></p>
                                </div>
                            </div>
                        )}

                        <div className="text-center text-xs text-gray-500">
                            <p>Pembayaran akan otomatis diverifikasi setiap 15 detik.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}