import { useNavigate } from "react-router-dom";
import { History, Edit3, LogOut, Lock, Mail } from "lucide-react";
import Swal from "sweetalert2";

export default function ProfileActions({ onEditProfile }) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        // Show confirmation dialog
        const result = await Swal.fire({
            title: 'Yakin ingin keluar?',
            text: "Anda akan diarahkan ke halaman utama setelah logout.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Logout!',
            cancelButtonText: 'Batal',
            reverseButtons: true,
            background: '#fff',
            color: '#333',
            customClass: {
                popup: 'rounded-2xl shadow-2xl',
                title: 'text-lg font-semibold',
                confirmButton: 'rounded-lg',
                cancelButton: 'rounded-lg'
            }
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem("user_token");

                const response = await fetch("/api/logout", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    localStorage.removeItem("user_token");

                    await Swal.fire({
                        title: 'Berhasil!',
                        text: 'Anda telah logout.',
                        icon: 'success',
                        confirmButtonColor: '#3085d6',
                        showConfirmButton: true,
                        background: '#fff',
                        color: '#333',
                        customClass: {
                            popup: 'rounded-2xl shadow-2xl',
                        }
                    });

                    navigate("/");
                } else {
                    throw new Error("Logout gagal");
                }
            } catch (error) {
                console.error("Error logout:", error);
                Swal.fire({
                    title: "Logout Gagal!",
                    text: "Silakan coba lagi",
                    icon: "error",
                    background: "#1e293b",
                    color: "#fff",
                });
            }
        }
    };

    const actions = [
        {
            icon: History,
            label: "Riwayat Pembelian",
            description: "Lihat semua transaksi",
            action: () => navigate("/purchase-history"),
            accent: "from-blue-500 to-blue-600",
            hover: "hover:shadow-lg hover:shadow-blue-500/25",
        },
        {
            icon: Edit3,
            label: "Edit Profil",
            description: "Ubah info profil",
            action: onEditProfile,
            accent: "from-blue-500 to-blue-600",
            hover: "hover:shadow-lg hover:shadow-blue-500/25",
        },
        {
            icon: Lock,
            label: "Ubah Password",
            description: "Update keamanan",
            action: () => navigate("/password/edit"),
            accent: "from-orange-500 to-orange-600",
            hover: "hover:shadow-lg hover:shadow-orange-500/25",
        },
        {
            icon: Mail,
            label: "Ubah Email",
            description: "Update keamanan",
            action: () => navigate("/email/edit"),
            accent: "from-orange-500 to-orange-600",
            hover: "hover:shadow-lg hover:shadow-orange-500/25",
        },
        {
            icon: LogOut,
            label: "Logout",
            description: "Keluar akun",
            action: handleLogout,
            accent: "from-red-500 to-red-600",
            isDangerous: true,
            hover: "hover:shadow-lg hover:shadow-red-500/25",
        },
    ];

    return (
        <div className="space-y-3 md:space-y-4">
            <div className="inline-block">
                <div className="text-xs md:text-sm font-bold text-yellow-400 tracking-widest uppercase mb-2 px-4 py-1 bg-zinc-900 border-2 border-yellow-400">
                    MENU UTAMA
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {actions.map((item, index) => {
                    const IconComponent = item.icon;
                    return (
                        <button
                            key={index}
                            onClick={item.action}
                            className="cursor-pointer relative group overflow-hidden transform transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                            <div
                                className={`absolute -inset-1 bg-linear-to-r from-yellow-400 to-yellow-300 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-md -z-10`}
                            />

                            <div className="absolute -inset-0.5 bg-linear-to-r from-yellow-400 to-yellow-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 rounded-lg" />

                            <div
                                className={`bg-linear-to-br ${item.accent} ${item.hover} border-2 border-yellow-400 p-4 md:p-5 relative transition-all duration-300 group-hover:border-yellow-300 group-hover:brightness-110`}
                            >
                                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                                <div className="flex items-start justify-between mb-3 relative z-10">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-yellow-400/20 rounded group-hover:bg-yellow-400/30 transition-colors duration-300">
                                            <IconComponent className="w-5 h-5 md:w-6 md:h-6 text-yellow-300 group-hover:text-yellow-200 transition-colors duration-300" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-black text-white text-sm md:text-base group-hover:text-yellow-50 transition-colors duration-300">
                                                {item.label}
                                            </p>
                                            <p className="text-xs text-yellow-100 group-hover:text-yellow-50 transition-colors duration-300">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute bottom-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div
                                        className="w-1 h-1 bg-yellow-300 rounded-full animate-bounce"
                                        style={{ animationDelay: "0ms" }}
                                    ></div>
                                    <div
                                        className="w-1 h-1 bg-yellow-300 rounded-full animate-bounce"
                                        style={{ animationDelay: "150ms" }}
                                    ></div>
                                    <div
                                        className="w-1 h-1 bg-yellow-300 rounded-full animate-bounce"
                                        style={{ animationDelay: "300ms" }}
                                    ></div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
