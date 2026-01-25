import { useState, useEffect, useRef } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const paymentMethods = [
    { id: "ovo", name: "OVO", description: "Pembayaran praktis dengan OVO. Transfer instan dengan keamanan terjamin." },
    { id: "gopay", name: "GoPay", description: "Bayar cepat dengan GoPay. Mudah dan aman untuk semua transaksi." },
    { id: "dana", name: "DANA", description: "Transaksi mudah dengan DANA. Proses instant tanpa ribet." },
];

const ITEM_HEIGHT = 60;

export default function PaymentMethodModal({ isOpen, onClose, onSelect }) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [confirmed, setConfirmed] = useState(false);
    const itemRefs = useRef([]);

    useEffect(() => {
        if (isOpen) {
            const saved = localStorage.getItem('selected_payment_method');
            const idx = saved ? paymentMethods.findIndex(m => m.id === saved) : 0;
            setSelectedIndex(idx !== -1 ? idx : 0);
            setConfirmed(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || confirmed) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
                return;
            }
            if (e.key === "ArrowDown") {
                e.preventDefault();
                const i = (selectedIndex + 1) % paymentMethods.length;
                setSelectedIndex(i);
                if (itemRefs.current[i]) itemRefs.current[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                const i = (selectedIndex - 1 + paymentMethods.length) % paymentMethods.length;
                setSelectedIndex(i);
                if (itemRefs.current[i]) itemRefs.current[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (e.key === "Enter") {
                e.preventDefault();
                handleConfirm();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, confirmed, selectedIndex, onClose]);

    const handleConfirm = () => {
        const method = paymentMethods[selectedIndex];
        localStorage.setItem('selected_payment_method', method.id);
        setConfirmed(true);
        onSelect(method.id);
        setTimeout(onClose, 1000);
    };

    const selectedMethod = paymentMethods[selectedIndex];
    const groundPosition = selectedIndex * ITEM_HEIGHT;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ">
            <div className="w-full max-w-md h-[85vh] flex flex-col overflow-hidden bg-[#f4d03f] rounded-xl shadow-2xl border-2 border-black" role="dialog" aria-modal="true">
                <div className="px-6 pt-6 pb-4 shrink-0">
                    <div className="bg-[#f4d03f] border-2 border-black rounded-tl-2xl rounded-tr-md px-4 py-2 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <h1 className="text-xl font-bold text-black tracking-wide">Pilih Metode Pembayaran</h1>
                    </div>
                </div>

                <div className="flex-1 relative overflow-hidden px-6">
                    <div className="relative">
                        <div className="relative z-10 py-3">
                            {paymentMethods.map((method, index) => {
                                const isSelected = selectedIndex === index;
                                const isBelow = index > selectedIndex;
                                return (
                                    <div key={method.id} className="transition-all duration-300" style={{ height: `${ITEM_HEIGHT}px` }} ref={(el) => (itemRefs.current[index] = el)}>
                                        <button
                                            onClick={() => !confirmed && setSelectedIndex(index)}
                                            disabled={confirmed}
                                            className={cn("group w-full text-left py-2 px-3 transition-all duration-300 flex items-center gap-3 h-full cursor-pointer", confirmed && !isSelected && "opacity-30")}
                                        >
                                            <ChevronRight
                                                className={cn(
                                                    "w-7 h-7 transition-all duration-300 shrink-0",
                                                    isSelected ? "opacity-100 translate-x-0 text-black animate-[bounce_1s_ease-in-out_infinite]" : "opacity-0 -translate-x-4",
                                                    isBelow && "text-[#f4d03f]"
                                                )}
                                            />
                                            <span
                                                className={cn(
                                                    "text-2xl font-bold tracking-wide transition-all duration-300",
                                                    isSelected && "text-black scale-105",
                                                    !isSelected && !isBelow && "text-black/70",
                                                    isBelow && "text-[#f4d03f]"
                                                )}
                                            >
                                                {method.name}
                                            </span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <div
                            className="absolute -left-10 -right-10 -bottom-60 bg-[#2a2a2a] transition-all duration-300 ease-out z-0"
                            style={{ top: `${groundPosition + ITEM_HEIGHT + 12}px` }}
                        />
                    </div>
                </div>

                <div className="bg-[#2a2a2a] text-white px-6 py-3 shrink-0">
                    <div className="min-h-12">
                        <p key={selectedIndex} className="text-sm leading-relaxed mb-2 text-gray-300">{selectedMethod.description}</p>
                    </div>
                    {!confirmed ? (
                        <div className="flex justify-end gap-3">
                            <button onClick={onClose} className="cursor-pointer bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 font-bold text-sm tracking-wide transition-all duration-200 hover:scale-[1.02] border border-black">BATAL</button>
                            <button onClick={handleConfirm} className="cursor-pointer bg-[#f4d03f] hover:bg-[#f4d03f]/90 text-black px-5 py-2 font-bold text-sm tracking-wide transition-all duration-200 hover:scale-[1.02] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] border-2 border-black">PILIH</button>
                        </div>
                    ) : (
                        <div className="flex justify-end items-center gap-2">
                            <div className="w-2 h-2 bg-[#f4d03f] rounded-full animate-pulse" />
                            <p className="text-[#f4d03f] font-bold text-sm">Disimpan!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}