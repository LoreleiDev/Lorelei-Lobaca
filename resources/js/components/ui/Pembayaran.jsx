import { useState, useEffect, useRef } from "react";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const paymentMethods = [
    {
        id: "ovo",
        name: "OVO",
        description: "Pembayaran praktis dengan OVO. Transfer instan dengan keamanan terjamin.",
    },
    {
        id: "gopay",
        name: "GOPAY",
        description: "Bayar cepat dengan GoPay. Mudah dan aman untuk semua transaksi.",
    },
    {
        id: "dana",
        name: "DANA",
        description: "Transaksi mudah dengan DANA. Proses instant tanpa ribet.",
    },
    {
        id: "shopeepay",
        name: "SHOPEE PAY",
        description: "Gunakan ShopeePay untuk pembayaran. Cepat, aman, dan praktis.",
    },
    {
        id: "bca_transfer",
        name: "BCA Transfer",
        description: "Transfer antar rekening BCA.",
    },
    {
        id: "bni_transfer",
        name: "BNI Transfer",
        description: "Transfer antar rekening BNI.",
    },
    {
        id: "bri_transfer",
        name: "BRI Transfer",
        description: "Transfer antar rekening BRI.",
    },
    {
        id: "mandiri_transfer",
        name: "Mandiri Transfer",
        description: "Transfer antar rekening Mandiri.",
    },
    {
        id: "permata_transfer",
        name: "Permata Transfer",
        description: "Transfer antar rekening Permata.",
    },
];

const ITEM_HEIGHT = 60;

export default function PaymentSelector() {
    document.title = "Payment - Lobaca";
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [confirmed, setConfirmed] = useState(false);
    const navigate = useNavigate();

    // Buat array ref untuk setiap item
    const itemRefs = useRef([]);

    useEffect(() => {
        const savedPaymentMethodId = localStorage.getItem('selected_payment_method');
        if (savedPaymentMethodId) {
            const savedIndex = paymentMethods.findIndex(method => method.id === savedPaymentMethodId);
            if (savedIndex !== -1) {
                setSelectedIndex(savedIndex);
            }
        }
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (confirmed) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                const newIndex = (selectedIndex + 1) % paymentMethods.length;
                setSelectedIndex(newIndex);

                // Scroll ke item baru
                if (itemRefs.current[newIndex]) {
                    itemRefs.current[newIndex].scrollIntoView({
                        behavior: 'smooth',
                        block: 'center', // Pusatkan item di tengah viewport
                    });
                }

            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                const newIndex = (selectedIndex - 1 + paymentMethods.length) % paymentMethods.length;
                setSelectedIndex(newIndex);

                // Scroll ke item baru
                if (itemRefs.current[newIndex]) {
                    itemRefs.current[newIndex].scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                    });
                }

            } else if (e.key === "Enter") {
                e.preventDefault();
                handleConfirm();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [confirmed, selectedIndex]); // Tambahkan selectedIndex ke dependency

    const handleConfirm = () => {
        setConfirmed(true);
        const selectedMethod = paymentMethods[selectedIndex];
        localStorage.setItem('selected_payment_method', selectedMethod.id);

        setTimeout(() => {
            navigate('/cart');
        }, 1000);
    };

    const handleBack = () => {
        navigate(-1);
    };

    const selectedMethod = paymentMethods[selectedIndex];
    const groundPosition = selectedIndex * ITEM_HEIGHT;

    return (
        <div className="w-full h-screen flex flex-col overflow-hidden bg-[#f4d03f]">
            {/* Header */}
            <div className="px-8 pt-8 pb-6 shrink-0">
                <div className="bg-[#f4d03f] border-2 border-black rounded-tl-3xl rounded-tr-md px-6 py-3 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h1 className="text-2xl font-bold text-black tracking-wide">
                        Atur Metode Pembayaran
                    </h1>
                </div>
            </div>

            <div className="flex-1 relative overflow-y-auto custom-scrollbar">
                <div className="w-full px-8 relative">
                    {/* List */}
                    <div className="relative z-10 py-4">
                        {paymentMethods.map((method, index) => {
                            const isSelected = selectedIndex === index;
                            const isBelowSelection = index > selectedIndex;

                            return (
                                <div
                                    key={method.id}
                                    className="transition-all duration-300"
                                    style={{ height: `${ITEM_HEIGHT}px` }}
                                    // Tambahkan ref ke div
                                    ref={(el) => (itemRefs.current[index] = el)}
                                >
                                    <button
                                        onClick={() => !confirmed && setSelectedIndex(index)}
                                        disabled={confirmed}
                                        className={cn(
                                            "group w-full text-left py-2 px-4 transition-all duration-300 flex items-center gap-4 h-full cursor-pointer",
                                            confirmed && !isSelected && "opacity-30"
                                        )}
                                    >
                                        <ChevronRight
                                            className={cn(
                                                "w-8 h-8 transition-all duration-300 shrink-0",
                                                isSelected
                                                    ? "opacity-100 translate-x-0 text-black animate-[bounce_1s_ease-in-out_infinite]"
                                                    : "opacity-0 -translate-x-4",
                                                isBelowSelection && "text-[#f4d03f]"
                                            )}
                                        />

                                        <span
                                            className={cn(
                                                "text-3xl font-bold tracking-wide transition-all duration-300 uppercase",
                                                isSelected && "text-black scale-105",
                                                !isSelected && !isBelowSelection && "text-black/70",
                                                isBelowSelection && "text-[#f4d03f]"
                                            )}
                                        >
                                            {method.name}
                                        </span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Ground */}
                    <div
                        className="absolute left-0 right-0 bottom-0 bg-[#333333] transition-all duration-300 ease-out z-0"
                        style={{
                            top: `${groundPosition + ITEM_HEIGHT + 16}px`,
                        }}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="bg-[#2a2a2a] text-white px-8 py-4 shrink-0 z-20">
                <div className="min-h-15">
                    <p
                        key={selectedIndex}
                        className="text-base leading-relaxed mb-4 text-gray-300 animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >
                        {selectedMethod.description}
                    </p>
                </div>

                <div className="flex justify-end gap-4 mb-2 items-center">
                    <button
                        onClick={handleBack}
                        className="cursor-pointer bg-[#f4d03f] hover:bg-[#f4d03f]/90 text-black px-8 py-3 font-bold text-lg tracking-wide transition-all duration-300 hover:scale-105 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black"
                    >
                        KEMBALI
                    </button>
                </div>

                {!confirmed ? (
                    <div className="flex justify-end gap-4 items-center">
                        <button
                            onClick={handleConfirm}
                            className="cursor-pointer bg-[#f4d03f] hover:bg-[#f4d03f]/90 text-black px-8 py-3 font-bold text-lg tracking-wide transition-all duration-300 hover:scale-105 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black"
                        >
                            KONFIRMASI
                        </button>
                    </div>
                ) : (
                    <div className="flex justify-end items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
                        <div className="w-3 h-3 bg-[#f4d03f] rounded-full animate-pulse" />
                        <p className="text-[#f4d03f] font-bold text-lg">
                            Metode pembayaran disimpan!
                        </p>
                    </div>
                )}
            </div>

            {/* Hint */}
            <footer className="bg-black text-white px-8 py-3 flex justify-between items-center z-20">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#f4d03f] animate-pulse" />
                        <span className="text-[10px] font-black italic uppercase tracking-widest">
                            Petunjuk: ↑↓ Pilih / Enter Konfirmasi
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
}