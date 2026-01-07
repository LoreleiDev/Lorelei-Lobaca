import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Eye, EyeOff } from "lucide-react";
import * as yup from "yup";
import Swal from "sweetalert2";
import ForgotBG from "../assets/Forgot-BG.webp";
import Loading from "@/components/ui/Loading";

// Validasi
const emailSchema = yup.object({
    email: yup
        .string()
        .email("Email tidak valid")
        .required("Email wajib diisi"),
});

const codeSchema = yup.object({
    code: yup
        .string()
        .required("Kode wajib diisi")
        .length(6, "Kode harus 6 digit"),
});

const passwordSchema = yup.object({
    password: yup
        .string()
        .min(8, "Minimal 8 karakter")
        .required("Password wajib diisi"),
    password_confirmation: yup
        .string()
        .oneOf([yup.ref("password")], "Password harus sama")
        .required("Konfirmasi password wajib diisi"),
});

export default function ForgotPassword() {
    document.title = "Forgot Password - Lobaca";
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form 1: Email
    const {
        register: registerEmail,
        handleSubmit: handleSubmitEmail,
        formState: { errors: errorsEmail },
    } = useForm({ resolver: yupResolver(emailSchema) });

    // Form 2: Kode
    const {
        register: registerCode,
        handleSubmit: handleSubmitCode,
        formState: { errors: errorsCode },
    } = useForm({ resolver: yupResolver(codeSchema) });

    // Form 3: Password
    const {
        register: registerPassword,
        handleSubmit: handleSubmitPassword,
        formState: { errors: errorsPassword },
    } = useForm({ resolver: yupResolver(passwordSchema) });

    // Kirim kode verifikasi
    const handleSendCode = async (data) => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/password/send-code", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            if (response.ok) {
                setEmail(data.email);
                setStep(2);
                Swal.fire({
                    icon: "success",
                    title: "Kode Terkirim!",
                    text: `Kode verifikasi telah dikirim ke ${data.email}`,
                    showConfirmButton: true,
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Gagal Mengirim Kode",
                    text: result.message || "Pastikan email terdaftar.",
                });
            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Kesalahan Jaringan",
                text: "Gagal terhubung ke server. Periksa koneksi Anda.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Verifikasi kode
    const handleVerifyCode = async (data) => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/password/verify-code", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ ...data, email }),
            });

            const result = await response.json();
            if (response.ok) {
                setCode(data.code);
                setStep(3);
                Swal.fire({
                    icon: "success",
                    title: "Kode Valid!",
                    text: "Silakan atur password baru Anda.",
                    showConfirmButton: true,
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Kode Tidak Valid",
                    text:
                        result.message ||
                        "Pastikan kode benar dan belum kadaluarsa.",
                });
            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Kesalahan Jaringan",
                text: "Gagal terhubung ke server.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Reset password
    const handleResetPassword = async (data) => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/password/reset", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    email,
                    code,
                    password: data.password,
                    password_confirmation: data.password_confirmation,
                }),
            });

            const result = await response.json();
            if (response.ok) {
                Swal.fire({
                    icon: "success",
                    title: "Password Berhasil Diubah!",
                    text: "Silakan login dengan password baru Anda.",
                    showConfirmButton: true,
                }).then(() => {
                    window.location.href = "/login";
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Gagal Mengubah Password",
                    text: result.message || "Terjadi kesalahan. Coba lagi.",
                });
            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Kesalahan Jaringan",
                text: "Gagal terhubung ke server.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="h-screen w-full bg-cover bg-center user-select-none overflow-hidden"
            style={{ backgroundImage: `url(${ForgotBG})` }}
        >
            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
                    <Loading />
                </div>
            )}

            <div
                className={`min-h-screen flex items-center justify-center transition-all duration-300 ${
                    isLoading ? "blur-sm" : ""
                }`}
            >
                <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-center mb-6">
                        {step === 1 && "Lupa Password?"}
                        {step === 2 && "Verifikasi Kode"}
                        {step === 3 && "Atur Password Baru"}
                    </h2>

                    {step === 1 && (
                        <form
                            onSubmit={handleSubmitEmail(handleSendCode)}
                            className="space-y-6"
                        >
                            {/* Email */}
                            <div className="relative">
                                <Input
                                    type="email"
                                    placeholder="Masukkan Email"
                                    {...registerEmail("email")}
                                    className={`w-full px-4 py-6 rounded-lg bg-white border ${
                                        errorsEmail.email
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    } text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 ${
                                        errorsEmail.email
                                            ? "focus:ring-red-500"
                                            : "focus:ring-slate-400"
                                    } focus:border-transparent transition pb-8`}
                                    disabled={isLoading}
                                />
                                {errorsEmail.email && (
                                    <p className="absolute bottom-2 left-4 text-red-500 text-xs">
                                        {errorsEmail.email.message}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="cursor-pointer w-full bg-black text-white py-4 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 text-lg font-medium"
                                disabled={isLoading}
                            >
                                {isLoading
                                    ? "Mengirim..."
                                    : "Kirim Kode Verifikasi"}
                            </Button>

                            <div className="text-center pt-4">
                                <a
                                    href="/login"
                                    className="text-gray-700 hover:text-gray-900 hover:underline text-sm font-medium"
                                >
                                    Kembali ke Halaman Login
                                </a>
                            </div>
                        </form>
                    )}

                    {step === 2 && (
                        <form
                            onSubmit={handleSubmitCode(handleVerifyCode)}
                            className="space-y-6"
                        >
                            <p className="text-gray-600 text-center text-sm">
                                Kami telah mengirim kode 6 digit ke{" "}
                                <strong className="text-blue-600">
                                    {email}
                                </strong>
                            </p>

                            {/* Kode Verifikasi */}
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder="Masukkan Kode Verifikasi"
                                    {...registerCode("code")}
                                    className={`w-full px-4 py-3 rounded-lg border ${
                                        errorsCode.code
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                    disabled={isLoading}
                                />
                                {errorsCode.code && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errorsCode.code.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex space-x-3">
                                <Button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="cursor-pointer flex-1 bg-gray-200 text-gray-800 py-4 rounded-lg hover:bg-gray-300 disabled:bg-gray-400 font-medium"
                                    disabled={isLoading}
                                >
                                    Kembali
                                </Button>
                                <Button
                                    type="submit"
                                    className="cursor-pointer flex-1 bg-black text-white py-4 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 font-medium"
                                    disabled={isLoading}
                                >
                                    {isLoading
                                        ? "Memverifikasi..."
                                        : "Verifikasi"}
                                </Button>
                            </div>
                        </form>
                    )}

                    {step === 3 && (
                        <form
                            onSubmit={handleSubmitPassword(handleResetPassword)}
                            className="space-y-6"
                        >
                            {/* Password Baru */}
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password Baru"
                                    {...registerPassword("password")}
                                    className={`w-full px-4 py-6 rounded-lg bg-white border ${
                                        errorsPassword.password
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    } text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 ${
                                        errorsPassword.password
                                            ? "focus:ring-red-500"
                                            : "focus:ring-slate-400"
                                    } focus:border-transparent transition pr-12 pb-8`}
                                    disabled={isLoading}
                                />
                                <Button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="cursor-pointer absolute right-4 top-1/2 transform -translate-y-1/2 bg-transparent hover:bg-transparent text-gray-500 hover:text-gray-700 transition p-0"
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </Button>
                                {errorsPassword.password && (
                                    <p className="absolute bottom-2 left-4 text-red-500 text-xs">
                                        {errorsPassword.password.message}
                                    </p>
                                )}
                            </div>

                            {/* Konfirmasi Password */}
                            <div className="relative">
                                <Input
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Konfirmasi Password Baru"
                                    {...registerPassword(
                                        "password_confirmation"
                                    )}
                                    className={`w-full px-4 py-6 rounded-lg bg-white border ${
                                        errorsPassword.password_confirmation
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    } text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 ${
                                        errorsPassword.password_confirmation
                                            ? "focus:ring-red-500"
                                            : "focus:ring-slate-400"
                                    } focus:border-transparent transition pr-12 pb-8`}
                                    disabled={isLoading}
                                />
                                <Button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword
                                        )
                                    }
                                    className="cursor-pointer absolute right-4 top-1/2 transform -translate-y-1/2 bg-transparent hover:bg-transparent text-gray-500 hover:text-gray-700 transition p-0"
                                    disabled={isLoading}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </Button>
                                {errorsPassword.password_confirmation && (
                                    <p className="absolute bottom-2 left-4 text-red-500 text-xs">
                                        {
                                            errorsPassword.password_confirmation
                                                .message
                                        }
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="cursor-pointer w-full bg-black text-white py-4 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 text-lg font-medium"
                                disabled={isLoading}
                            >
                                {isLoading
                                    ? "Menyimpan..."
                                    : "Simpan Password Baru"}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
