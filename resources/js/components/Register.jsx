import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Swal from "sweetalert2";
import RegisterBG from "../assets/Register-BG.webp";
import Loading from "@/components/ui/Loading";

// Validasi Input
const schema = yup.object({
    firstName: yup.string().required("Nama depan wajib diisi"),
    lastName: yup.string().required("Nama belakang wajib diisi"),
    phone: yup.string().required("Nomor Telepon wajib diisi"),
    email: yup
        .string()
        .email("Format email tidak valid")
        .required("Email wajib diisi"),
    password: yup
        .string()
        .min(8, "Password minimal 8 karakter")
        .required("Password wajib diisi"),
});

export default function Register() {
    document.title = "Register - Lobaca";
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            firstName: "",
            lastName: "",
            phone: "",
            email: "",
            password: "",
        },
    });

    // Handle submit ke API
    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    first_name: data.firstName,
                    last_name: data.lastName,
                    phone: data.phone,
                    email: data.email,
                    password: data.password,
                    password_confirmation: data.password,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem("user_token", result.access_token);
                //  SweetAlert Sukses
                Swal.fire({
                    icon: "success",
                    title: "Registrasi Berhasil!",
                    text: "Akun Anda telah dibuat. Silakan login.",
                    showConfirmButton: true,
                }).then(() => {
                    navigate("/login");
                });
            } else {
                //  SweetAlert Error Validasi atau Server
                let errorMessage = "Registrasi gagal. Silakan coba lagi.";
                if (result.errors) {
                    errorMessage = Object.values(result.errors)
                        .flat()
                        .join("\n");
                } else if (result.message) {
                    errorMessage = result.message;
                }

                Swal.fire({
                    icon: "error",
                    title: "Registrasi Gagal",
                    text: errorMessage,
                    confirmButtonText: "OK",
                });
            }
        } catch (error) {
            //  SweetAlert Error Jaringan
            Swal.fire({
                icon: "error",
                title: "Kesalahan Jaringan",
                text: "Gagal terhubung ke server. Periksa koneksi internet Anda.",
                confirmButtonText: "Coba Lagi",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="h-screen w-full bg-cover bg-center user-select-none overflow-hidden"
            style={{ backgroundImage: `url(${RegisterBG})` }}
        >
            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
                    <Loading />
                </div>
            )}
            <div className="flex items-center justify-center pt-28 relative">
                <div className="p-10 z-10 min-w-lg relative">
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-4 w-full"
                    >
                        {/* First Name */}
                        <div className="relative">
                            <Input
                                type="text"
                                placeholder="Masukkan Nama Depan"
                                {...register("firstName")}
                                className={`w-full px-4 py-6 rounded-lg bg-white border ${
                                    errors.firstName
                                        ? "border-red-500"
                                        : "border-gray-300"
                                } text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 ${
                                    errors.firstName
                                        ? "focus:ring-red-500"
                                        : "focus:ring-slate-400"
                                } focus:border-transparent transition pb-8`}
                            />
                            {errors.firstName && (
                                <p className="absolute bottom-2 left-4 text-red-500 text-xs">
                                    {errors.firstName.message}
                                </p>
                            )}
                        </div>

                        {/* Last Name */}
                        <div className="relative">
                            <Input
                                type="text"
                                placeholder="Masukkan Nama Belakang"
                                {...register("lastName")}
                                className={`w-full px-4 py-6 rounded-lg bg-white border ${
                                    errors.lastName
                                        ? "border-red-500"
                                        : "border-gray-300"
                                } text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 ${
                                    errors.lastName
                                        ? "focus:ring-red-500"
                                        : "focus:ring-slate-400"
                                } focus:border-transparent transition pb-8`}
                            />
                            {errors.lastName && (
                                <p className="absolute bottom-2 left-4 text-red-500 text-xs">
                                    {errors.lastName.message}
                                </p>
                            )}
                        </div>

                        {/* Phone Number */}
                        <div className="relative">
                            <Input
                                type="tel"
                                placeholder="Masukkan Nomor Telepon"
                                {...register("phone", {
                                    onChange: (e) => {
                                        const cleaned = e.target.value.replace(
                                            /\D/g,
                                            ""
                                        );
                                        e.target.value = cleaned;
                                    },
                                })}
                                className={`w-full px-4 py-6 rounded-lg bg-white border ${
                                    errors.phone
                                        ? "border-red-500"
                                        : "border-gray-300"
                                } text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 ${
                                    errors.phone
                                        ? "focus:ring-red-500"
                                        : "focus:ring-slate-400"
                                } focus:border-transparent transition pb-8
                                [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                            />
                            {errors.phone && (
                                <p className="absolute bottom-2 left-4 text-red-500 text-xs">
                                    {errors.phone.message}
                                </p>
                            )}
                        </div>

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
                                disabled={isLoading} 
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </Button>
                            {errors.password && (
                                <p className="absolute bottom-2 left-4 text-red-500 text-xs">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Register Button */}
                        <Button
                            type="submit"
                            className="text-xl cursor-pointer w-full bg-black text-white font-semibold py-6 rounded-lg hover:bg-gray-900 transition mt-6"
                        >
                            Register
                        </Button>
                    </form>
                </div>
            </div>
            <div className="text-center">
                <a
                    href="/login"
                    className="text-gray-700 hover:text-gray-900 hover:underline text-sm font-medium"
                >
                    Sudah Punya Akun?
                </a>
            </div>
        </div>
    );
}
