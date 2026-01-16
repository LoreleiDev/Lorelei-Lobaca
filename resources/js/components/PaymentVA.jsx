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
    const { vaNumbers, orderId, grossAmount, paymentMethod } = location.state || {};

    console.log("PaymentVa - Location State:", location.state);

    const [countdown, setCountdown] = useState(15 * 60); 
    const [status, setStatus] = useState('pending'); 


    useEffect(() => {
        if (!vaNumbers || !orderId || !paymentMethod) {
            console.error("PaymentVa - Missing required data in state.");
            Toast.fire({ icon: "error", title: "Data pembayaran tidak valid." });
            navigate('/cart', { replace: true });
            return;
        }

        let timer;
        if (countdown > 0 && status === 'pending') {
            timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        setStatus('failed'); 
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [orderId, navigate, countdown, status]);

    if (!vaNumbers || !orderId || !paymentMethod) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-gray-600">Memuat...</p>
            </div>
        );
    }

    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;

    const bankName = paymentMethod.replace('_va', '').toUpperCase(); 
    const vaNumber = Array.isArray(vaNumbers) ? vaNumbers[0]?.va_number : vaNumbers;

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-green-50 py-8">
                <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-green-600">Pembayaran Berhasil!</h2>
                        <p className="text-gray-600 mt-2">Terima kasih, pembayaran untuk order {orderId} telah diterima.</p>
                        <Button
                            onClick={() => navigate('/transaksi', { state: { orderId } })}
                            className="mt-6 bg-green-600 hover:bg-green-700 w-full"
                        >
                            Lihat Status Transaksi
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'failed') {
        return (
            <div className="min-h-screen bg-red-50 py-8">
                <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-red-600">Pembayaran Kadaluarsa!</h2>
                        <p className="text-gray-600 mt-2">Waktu pembayaran untuk order {orderId} telah habis.</p>
                        <Button
                            onClick={() => navigate('/cart')}
                            className="mt-6 bg-red-600 hover:bg-red-700 w-full"
                        >
                            Kembali ke Keranjang
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-center mb-4">Bayar via Virtual Account</h2>
                <p className="text-center text-gray-600 mb-2">Order ID: {orderId}</p>
                <p className="text-center text-gray-600 mb-6">Sisa Waktu: {minutes}:{seconds < 10 ? '0' : ''}{seconds}</p>

                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
                    <p className="font-bold">Detail Pembayaran:</p>
                    <div className="mt-2">
                        <p className="mb-1"><span className="font-semibold">Bank:</span> {bankName}</p>
                        <p className="mb-1"><span className="font-semibold">Nomor VA:</span> <strong>{vaNumber}</strong></p>
                        <p><span className="font-semibold">Jumlah:</span> <strong>IDR {new Intl.NumberFormat('id-ID').format(grossAmount)}</strong></p>
                    </div>
                </div>

                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
                    <p className="font-bold">Instruksi Pembayaran:</p>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Buka aplikasi mobile banking atau ATM dari bank {bankName}.</li>
                        <li>Pilih menu <strong>Transfer</strong>.</li>
                        <li>Masukkan <strong>Nomor VA ({vaNumber})</strong> sebagai nomor rekening tujuan.</li>
                        <li>Masukkan <strong>Jumlah Pembayaran (IDR {new Intl.NumberFormat('id-ID').format(grossAmount)})</strong> secara <strong>eksak</strong>.</li>
                        <li>Lanjutkan proses transfer hingga selesai.</li>
                    </ol>
                </div>

                <Button
                    onClick={() => navigate('/transaksi', { state: { orderId } })}
                    variant="outline"
                    className="w-full"
                >
                    Lihat Status Pembayaran
                </Button>
            </div>
        </div>
    );
}