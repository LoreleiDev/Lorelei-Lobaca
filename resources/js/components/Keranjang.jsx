import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, ShoppingCart, Tag } from "lucide-react";
import NavbarHome from "./ui/NavbarHome";
import Loading from "./ui/Loading";
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

const BOOK_CATEGORIES = [
    { value: "fiksi", label: "Fiksi" },
    { value: "non_fiksi", label: "Non-Fiksi" },
    { value: "seni_kreatif", label: "Seni & Kreatif" },
    { value: "gaya_hidup", label: "Gaya Hidup" },
    { value: "pendidikan", label: "Pendidikan" },
    { value: "buku_anak", label: "Buku Anak" },
    { value: "komik", label: "Komik" },
    { value: "novel", label: "Novel" },
    { value: "majalah", label: "Majalah" },
];

const getCategoryLabels = (categoryString) => {
    if (!categoryString) return [];
    return categoryString
        .split(",")
        .map((cat) => cat.trim())
        .filter(Boolean)
        .map((cat) => {
            const found = BOOK_CATEGORIES.find((c) => c.value === cat);
            return found ? found.label : cat;
        });
};

const paymentMethodLabels = {
    "ovo": "OVO",
    "gopay": "GoPay",
    "dana": "DANA",
    "shopeepay": "Shopee Pay",
    "bca_transfer": "BCA Transfer",
    "bni_transfer": "BNI Transfer",
    "bri_transfer": "BRI Transfer",
    "mandiri_transfer": "Mandiri Transfer",
    "permata_transfer": "Permata Transfer",
    "bank-transfer": "Transfer Bank"
};

const formatCourierName = (name) => {
    if (!name) return "Belum Dipilih";
    return name
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export default function KeranjangPage() {
    document.title = "Keranjang - Lobaca";
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
    const [ongkir, setOngkir] = useState(() => {
        const saved = localStorage.getItem('shipping_cost');
        return saved ? parseInt(saved) : 0;
    });
    const [selectedCourierName, setSelectedCourierName] = useState(() => {
        return localStorage.getItem('selected_courier_name') || "";
    });
    const [Youraddress, setYouraddress] = useState(() => {
        return localStorage.getItem('alamat_lengkap') || "";
    });

    const fetchCart = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('user_token');
            const res = await fetch("/api/cart", {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setCartItems(data.data.items || []);
            } else {
                Toast.fire({ icon: "error", title: "Gagal memuat keranjang." });
            }
        } catch (error) {
            Toast.fire({ icon: "error", title: "Kesalahan jaringan." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();

        const savedPayment = localStorage.getItem('selected_payment_method');
        if (savedPayment) setSelectedPaymentMethod(savedPayment);
    }, []);

    useEffect(() => {
        const handleStorageChange = () => {
            const savedAddress = localStorage.getItem('alamat_lengkap');
            const savedCourierName = localStorage.getItem('selected_courier_name');
            setYouraddress(savedAddress || "");
            setSelectedCourierName(savedCourierName || "");
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const updateQuantity = async (itemId, newQuantity, maxStok) => {
        if (newQuantity < 1) return;

        if (newQuantity > maxStok) {
            Toast.fire({
                icon: "warning",
                title: `Stok hanya tersedia ${maxStok}. Jumlah tidak bisa ditambah.`
            });
            return;
        }

        const token = localStorage.getItem('user_token');
        const res = await fetch(`/api/cart/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ jumlah: newQuantity })
        });

        if (res.ok) {
            Toast.fire({ icon: "success", title: "Jumlah berhasil diubah." });
            fetchCart();
        } else {
            Toast.fire({ icon: "error", title: "Gagal mengubah jumlah." });
        }
    };

    const removeItem = async (itemId) => {
        const token = localStorage.getItem('user_token');
        const res = await fetch(`/api/cart/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.ok) {
            Toast.fire({ icon: "success", title: "Item berhasil dihapus." });
            fetchCart();
        } else {
            Toast.fire({ icon: "error", title: "Gagal menghapus item." });
        }
    };

    const navigateToBookDetail = (slug, bookId) => {
        if (!slug || !bookId) {
            Toast.fire({ icon: "info", title: "Informasi buku tidak lengkap untuk navigasi." });
            return;
        }
        navigate(`/buku/${slug}`, { state: { id: bookId } });
    };

    const calculateTotals = () => {
        let subtotal = 0;
        let totalDiscount = 0;

        cartItems.forEach(item => {
            const originalPrice = item.buku.harga;
            const quantity = item.jumlah;
            const discountPercent = item.buku.discount_percent || 0;

            if (discountPercent > 0) {
                const discountAmount = Math.round(originalPrice * discountPercent / 100);
                totalDiscount += discountAmount * quantity;
            }

            subtotal += originalPrice * quantity;
        });

        return {
            subtotal,
            totalDiscount,
            finalTotal: subtotal - totalDiscount
        };
    };

    const { subtotal, totalDiscount, finalTotal } = calculateTotals();
    const totalBayar = finalTotal + ongkir;

    const handlePilihAlamatKurir = () => {
        navigate('/alamat-kurir');
    };

    const handleCheckout = async () => {
        const alamatLengkap = localStorage.getItem('alamat_lengkap');
        const ongkirValue = localStorage.getItem('shipping_cost');
        const kurirCode = localStorage.getItem('selected_courier_code');
        const destinationDistrictId = localStorage.getItem('destination_district_id');
        const paymentMethodFromLS = localStorage.getItem('selected_payment_method');

        if (!alamatLengkap || !ongkirValue || !kurirCode || !destinationDistrictId) {
            Toast.fire({ icon: "error", title: "Lengkapi alamat dan kurir terlebih dahulu." });
            return;
        }
        if (!paymentMethodFromLS) {
            Toast.fire({ icon: "error", title: "Pilih metode pembayaran terlebih dahulu." });
            return;
        }

        const token = localStorage.getItem('user_token');
        try {
            const res = await fetch('/api/checkout/process-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    alamat_pengiriman: alamatLengkap,
                    kurir: kurirCode,
                    ongkir: parseInt(ongkirValue),
                    destination_district_id: parseInt(destinationDistrictId),
                    payment_method: paymentMethodFromLS
                })
            });

            // --- BACA RESPON HANYA SEKALI ---
            const responseText = await res.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error("Failed to parse JSON response:", e);
                console.error("Raw response was:", responseText);
                Toast.fire({ icon: "error", title: "Respon dari server tidak valid." });
                return;
            }
            console.log("Parsed response ", data);
            // --- END BACA RESPON ---

            if (res.ok) {
                console.log("Response OK, checking for redirect, VA, or QR Code...");
                const midtransResponse = data.data;

                // Cek redirect_url (untuk halaman pembayaran Midtrans)
                if (midtransResponse.redirect_url) {
                    console.log("Redirecting to Midtrans page:", midtransResponse.redirect_url);
                    window.location.href = midtransResponse.redirect_url;
                    return; // Stop execution here if redirecting
                }

                // Cek apakah ini Virtual Account (VA)
                const vaNumbers = midtransResponse.va_numbers;
                const paymentType = midtransResponse.payment_type;
                const grossAmount = midtransResponse.gross_amount;
                const orderId = midtransResponse.order_id;

                if (paymentType === 'bank_transfer' && vaNumbers && vaNumbers.length > 0) {
                    console.log("Virtual Account detected:", vaNumbers);
                    // Navigate to PaymentVa page with VA details
                    navigate('/payment-va', {
                        state: {
                            vaNumbers,
                            orderId,
                            grossAmount: parseFloat(grossAmount),
                            paymentMethod: paymentMethodFromLS // Kirim metode pembayaran asli
                        }
                    });
                    return; // Stop execution here if navigating to VA page
                }

                // Cek apakah ini QRIS
                let qrCodeData = null;
                if (midtransResponse.actions && Array.isArray(midtransResponse.actions)) {
                    const qrisAction = midtransResponse.actions.find(action => action.name === 'generate-qr-code');
                    if (qrisAction && qrisAction.url) {
                        qrCodeData = qrisAction.url;
                    }
                }

                if (qrCodeData) {
                    console.log("QRIS detected, navigating to Qris page");
                    navigate('/payment-qris', { state: { qrCodeData, orderId } });
                    return; // Stop execution here if navigating to Qris page
                }

                // Jika tidak ada redirect_url, VA, atau QRIS, mungkin untuk CC atau metode lain
                console.log("No specific action found, showing generic message.");
                Toast.fire({ icon: "info", title: `Silakan selesaikan pembayaran untuk ${paymentType || 'metode pembayaran'}.` });

            } else {
                // Gunakan data.error dari respons JSON yang sudah diparse
                Toast.fire({
                    icon: "error",
                    title: data.message || "Gagal checkout.",
                    text: data.error || ""
                });
            }
        } catch (error) {
            console.error("Network error during checkout:", error);
            Toast.fire({ icon: "error", title: "Kesalahan jaringan." });
        }
    };

    if (loading) {
        return (
            <>
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
                    <Loading />
                </div>
            </>
        );
    }

    return (
        <>
            <NavbarHome />
            <div className="pt-20 pb-6 px-4 bg-linear-to-r from-blue-600 to-yellow-500">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <Tag className="w-4 h-4 text-white" />
                        </div>
                        <h1 className="text-2xl md:text-3xl text-white" style={{ fontFamily: "Rubik Mono One" }}>
                            Keranjang
                        </h1>
                    </div>
                    <p className="text-blue-100 text-sm max-w-2xl">
                        Lihat dan kelola barang-barang yang telah kamu tambahkan ke keranjang.
                    </p>
                </div>
            </div>

            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-6xl mx-auto px-4">
                    {cartItems.length === 0 ? (
                        <div className="text-center py-16">
                            <ShoppingCart className="mx-auto text-gray-400" size={64} />
                            <p className="text-gray-600 mt-4 text-lg">Keranjang kamu kosong.</p>
                            <Link to="/buku" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                                Cari Buku
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                    <div className="p-4 border-b border-gray-200">
                                        <h2 className="text-lg font-semibold text-gray-800">Daftar Barang</h2>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {cartItems.map((item) => {
                                            const originalPrice = item.buku.harga;
                                            const discountPercent = item.buku.discount_percent || 0;
                                            const discountAmount = discountPercent > 0 ? Math.round(originalPrice * discountPercent / 100) : 0;
                                            const discountedPrice = originalPrice - discountAmount;
                                            const itemTotal = discountedPrice * item.jumlah;
                                            const maxStok = item.buku.stok;

                                            return (
                                                <div key={item.cart_item_id} className="p-4 flex flex-col sm:flex-row gap-4">
                                                    <img
                                                        src={item.buku.foto}
                                                        alt={item.buku.judul}
                                                        className="w-24 h-32 object-cover rounded-md border border-gray-200 cursor-pointer"
                                                        onClick={() => navigateToBookDetail(item.buku.slug, item.buku.id)}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex justify-between">
                                                            <h3
                                                                className="font-semibold text-gray-800 cursor-pointer hover:underline"
                                                                onClick={() => navigateToBookDetail(item.buku.slug, item.buku.id)}
                                                            >
                                                                {item.buku.judul}
                                                            </h3>
                                                            <button
                                                                onClick={() => removeItem(item.cart_item_id)}
                                                                className="cursor-pointer text-red-600 hover:text-red-800 flex items-center gap-1 text-sm"
                                                            >
                                                                <Trash2 size={16} /> Hapus
                                                            </button>
                                                        </div>
                                                        <p className="text-gray-600 text-sm">{item.buku.penulis}</p>

                                                        {item.buku.kategori && (
                                                            <div className="mt-1 flex flex-wrap gap-1">
                                                                {getCategoryLabels(item.buku.kategori).map((label, i) => (
                                                                    <span
                                                                        key={i}
                                                                        className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full truncate"
                                                                    >
                                                                        {label}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <div className="mt-3 flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => updateQuantity(item.cart_item_id, item.jumlah - 1, Infinity)}
                                                                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                                                                >
                                                                    <Minus size={16} />
                                                                </button>
                                                                <span className="text-gray-800 font-medium">{item.jumlah}</span>
                                                                <button
                                                                    onClick={() => updateQuantity(item.cart_item_id, item.jumlah + 1, maxStok)}
                                                                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                                                                >
                                                                    <Plus size={16} />
                                                                </button>
                                                            </div>
                                                            <div className="text-right">
                                                                {discountPercent > 0 ? (
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="text-green-600 font-bold">
                                                                            {new Intl.NumberFormat('id-ID', {
                                                                                style: 'currency',
                                                                                currency: 'IDR',
                                                                                minimumFractionDigits: 0
                                                                            }).format(itemTotal)}
                                                                        </span>
                                                                        <span className="text-gray-500 line-through text-xs">
                                                                            {new Intl.NumberFormat('id-ID', {
                                                                                style: 'currency',
                                                                                currency: 'IDR',
                                                                                minimumFractionDigits: 0
                                                                            }).format(originalPrice * item.jumlah)}
                                                                        </span>
                                                                        <span className="text-red-600 text-xs">
                                                                            -{new Intl.NumberFormat('id-ID', {
                                                                                style: 'currency',
                                                                                currency: 'IDR',
                                                                                minimumFractionDigits: 0
                                                                            }).format(discountAmount * item.jumlah)}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-800 font-bold">
                                                                        {new Intl.NumberFormat('id-ID', {
                                                                            style: 'currency',
                                                                            currency: 'IDR',
                                                                            minimumFractionDigits: 0
                                                                        }).format(itemTotal)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {item.jumlah > maxStok && (
                                                            <p className="text-red-600 text-xs mt-2">
                                                                Stok hanya {maxStok} buku
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Ringkasan Belanja</h2>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Subtotal</span>
                                            <span>
                                                {new Intl.NumberFormat('id-ID', {
                                                    style: 'currency',
                                                    currency: 'IDR',
                                                    minimumFractionDigits: 0
                                                }).format(subtotal)}
                                            </span>
                                        </div>
                                        {totalDiscount > 0 && (
                                            <div className="flex justify-between text-red-600">
                                                <span>Diskon</span>
                                                <span>
                                                    -{new Intl.NumberFormat('id-ID', {
                                                        style: 'currency',
                                                        currency: 'IDR',
                                                        minimumFractionDigits: 0
                                                    }).format(totalDiscount)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-gray-600">
                                            <span>Ongkos Kirim</span>
                                            <span>
                                                {ongkir > 0
                                                    ? new Intl.NumberFormat('id-ID', {
                                                        style: 'currency',
                                                        currency: 'IDR',
                                                        minimumFractionDigits: 0
                                                    }).format(ongkir)
                                                    : selectedCourierName
                                                        ? new Intl.NumberFormat('id-ID', {
                                                            style: 'currency',
                                                            currency: 'IDR',
                                                            minimumFractionDigits: 0
                                                        }).format(ongkir)
                                                        : "-"}
                                            </span>
                                        </div>
                                        <div className="border-t border-gray-200 pt-3 mt-3">
                                            <div className="flex justify-between font-bold text-lg text-gray-800">
                                                <span>Total Bayar</span>
                                                <span>
                                                    {new Intl.NumberFormat('id-ID', {
                                                        style: 'currency',
                                                        currency: 'IDR',
                                                        minimumFractionDigits: 0
                                                    }).format(totalBayar)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Alamat & Kurir
                                            </label>
                                            <div className="mt-2 px-2 py-1 bg-gray-50 rounded border border-gray-200">
                                                <p className="text-gray-800 text-xs italic">
                                                    {Youraddress || "Alamat belum diatur. Silakan lengkapi."}
                                                </p>
                                                <p className="text-gray-800 text-md mt-1 font-bold">
                                                    Kurir: {formatCourierName(selectedCourierName)}
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-end gap-2 mt-2 px-2">
                                                <button
                                                    onClick={handlePilihAlamatKurir}
                                                    className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm underline"
                                                >
                                                    {Youraddress && selectedCourierName ? "Ubah" : "Atur"}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran</label>
                                            <div className="flex items-center justify-between gap-2 mt-2 px-2">
                                                <span className="text-gray-500 font-medium">
                                                    {paymentMethodLabels[selectedPaymentMethod] || "Belum Dipilih"}
                                                </span>
                                                <button
                                                    onClick={() => navigate('/payment')}
                                                    className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm underline"
                                                >
                                                    Ubah
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleCheckout}
                                        className="w-full mt-6 bg-blue-600 hover:bg-blue-700 py-3 font-medium"
                                        disabled={!Youraddress || !selectedPaymentMethod}
                                    >
                                        Checkout
                                    </Button>
                                    <Link to="/buku" className="block text-center mt-3 text-blue-600 hover:text-blue-800 text-sm">
                                        ← Lanjutkan Belanja
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}