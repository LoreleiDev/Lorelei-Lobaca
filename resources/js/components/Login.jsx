import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Swal from "sweetalert2";
import LoginBG from "../assets/Login-BG.webp";
import Loading from "@/components/ui/Loading";

// Validasi Input
const schema = yup.object({
    email: yup
        .string()
        .email("Format email tidak valid")
        .required("Email wajib diisi"),
    password: yup
        .string()
        .min(8, "Password minimal 8 karakter")
        .required("Password wajib diisi"),
});

export default function Login() {
    document.title = "Login - Lobaca";
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
    });

    const onSubmit = async (data) => {
        const adminToken = localStorage.getItem("admin_token");
        if (adminToken) {
            localStorage.removeItem("admin_token");
        }
        setIsLoading(true);
        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    email: data.email,
                    password: data.password,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem("user_token", result.access_token);
                // SweetAlert Sukses
                Swal.fire({
                    icon: "success",
                    title: "Login Berhasil!",
                    text: "Selamat datang!",
                    showConfirmButton: true,
                }).then(() => {
                    navigate("/");
                });
            } else {
                if (response.status === 423) {
                    // SweetAlert Akun Terkunci
                    Swal.fire({
                        icon: "error",
                        title: "Akun Terkunci",
                        text: "Akun Anda terkunci karena terlalu banyak percobaan gagal. Silakan reset password Anda.",
                        confirmButtonText: "Reset Password",
                    }).then((result) => {
                        if (result.isConfirmed) {
                            navigate("/password/forgot");
                        }
                    });
                } else {
                    // SweetAlert Error Login
                    Swal.fire({
                        icon: "error",
                        title: "Login Gagal",
                        text: result.message || "Email atau password salah.",
                    });
                }
            }
        } catch (error) {
            // SweetAlert Error Koneksi
            Swal.fire({
                icon: "error",
                title: "Kesalahan Jaringan",
                text: "Gagal terhubung ke server. Periksa koneksi internet Anda.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="h-screen w-full bg-cover bg-center user-select-none overflow-hidden"
            style={{ backgroundImage: `url(${LoginBG})` }}
        >
            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
                    <Loading />
                </div>
            )}
            <div className="min-h-screen flex items-center justify-center">
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="w-full max-w-md space-y-6"
                >
                    {/* Email */}
                    <div className="relative">
                        <Input
                            type="email"
                            placeholder="Masukkan Email"
                            {...register("email")}
                            className={`w-full px-4 py-6 rounded-lg bg-white border ${
                                errors.email
                                    ? "border-red-500"
                                    : "border-gray-300"
                            } text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 ${
                                errors.email
                                    ? "focus:ring-red-500"
                                    : "focus:ring-slate-400"
                            } focus:border-transparent transition pb-8`}
                        />
                        {errors.email && (
                            <p className="absolute bottom-2 left-4 text-red-500 text-xs">
                                {errors.email.message}
                            </p>
                        )}
                    </div>
                    {/* Password */}
                    <div className="relative">
                        <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Masukkan Password"
                            {...register("password")}
                            className={`w-full px-4 py-6 rounded-lg bg-white border ${
                                errors.password
                                    ? "border-red-500"
                                    : "border-gray-300"
                            } text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 ${
                                errors.password
                                    ? "focus:ring-red-500"
                                    : "focus:ring-slate-400"
                            } focus:border-transparent transition pr-12 pb-8`}
                        />
                        <Button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="cursor-pointer absolute right-4 top-1/2 transform -translate-y-1/2 bg-transparent hover:bg-transparent text-gray-500 hover:text-gray-700 transition p-0"
                        >
                            {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                            ) : (
                                <Eye className="w-5 h-5" />
                            )}
                        </Button>
                        {errors.password && (
                            <p className="absolute bottom-2 left-4 text-red-500 text-xs">
                                {" "}
                                {errors.password.message}
                            </p>
                        )}
                    </div>
                    {/* Login Button */}
                    <Button
                        type="submit"
                        className="text-xl cursor-pointer w-full bg-black text-white font-semibold py-6 rounded-lg hover:bg-gray-900 transition "
                        disabled={isLoading}
                    >
                        Login
                    </Button>
                    {/* Lupa Password Link */}
                    <div className="text-sm text-center space-x-56">
                        <a
                            href="/password/forgot"
                            className=" text-gray-600 hover:text-gray-900 hover:underline"
                        >
                            Lupa Password?
                        </a>

                        <a
                            href="/register"
                            className=" text-gray-600 hover:text-gray-900 hover:underline"
                        >
                            Belum Punya Akun?
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}
