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

    const { qrCodeUrl, orderId } = location.state || {};

    console.log("PaymentQris - Location State:", location.state);
    console.log("PaymentQris - Extracted qrCodeUrl:", qrCodeUrl);

    console.log("PaymentQris - Extracted orderId:", orderId);

    const [countdown, setCountdown] = useState(15 * 60);

    useEffect(() => {

        if (!qrCodeUrl || !orderId) {
            console.error("PaymentQris - Missing qrCodeUrl or orderId in state.");
            Toast.fire({ icon: "error", title: "Data pembayaran tidak valid." });
            navigate('/cart', { replace: true });
            return;
        }

        let timer;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else {
            Toast.fire({ icon: "warning", title: "Waktu pembayaran habis." });
            navigate('/transaksi', { state: { orderId }, replace: true });
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [qrCodeUrl, orderId, navigate]);

    console.log("PaymentQris - Render, qrCodeUrl:", qrCodeUrl, "orderId:", orderId, "countdown:", countdown);


    if (!qrCodeUrl || !orderId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-gray-600">Memuat...</p>
            </div>
        );
    }

    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-center mb-4">Scan QRIS untuk Pembayaran</h2>
                <p className="text-center text-gray-600 mb-2">Order ID: {orderId}</p>
                <p className="text-center text-gray-600 mb-6">Sisa Waktu: {minutes}:{seconds < 10 ? '0' : ''}{seconds}</p>

                <div className="flex justify-center mb-6">
                    <img
                        src={qrCodeUrl}
                        alt="QRIS Code"
                        className="w-48 h-48 object-contain"
                        onError={(e) => {
                            console.error("Failed to load QR image from URL:", qrCodeUrl);

                        }}
                    />
                </div>

                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
                    <p className="font-bold">Instruksi Pembayaran:</p>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Buka aplikasi pembayaran yang mendukung QRIS (DANA, OVO, ShopeePay, dll).</li>
                        <li>Pilih menu Scan QR.</li>
                        <li>Arahkan kamera ke QR Code di atas.</li>
                        <li>Ikuti instruksi di aplikasi untuk menyelesaikan pembayaran.</li>
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