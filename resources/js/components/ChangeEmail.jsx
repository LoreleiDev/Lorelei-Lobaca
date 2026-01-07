import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Swal from "sweetalert2";
import EmailBG from "../assets/Email-BG.webp";
import Loading from "@/components/ui/Loading";

// Validasi
const currentEmailSchema = yup.object({
    email: yup.string().email("Email tidak valid").required("Email wajib diisi"),
});

const codeSchema = yup.object({
    code: yup.string().required("Kode wajib diisi").length(6, "Kode harus 6 digit"),
});

const newEmailSchema = yup.object({
    new_email: yup
        .string()
        .email("Email tidak valid")
        .required("Email baru wajib diisi"),
});

export default function ChangeEmail() {
    document.title = "Ganti Email - Lobaca";
    const [step, setStep] = useState(1);
    const [currentEmail, setCurrentEmail] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const {
        register: registerCurrent,
        handleSubmit: handleSubmitCurrent,
        formState: { errors: errorsCurrent },
    } = useForm({ resolver: yupResolver(currentEmailSchema) });

    const {
        register: registerCode,
        handleSubmit: handleSubmitCode,
        formState: { errors: errorsCode },
    } = useForm({ resolver: yupResolver(codeSchema) });

    const {
        register: registerNew,
        handleSubmit: handleSubmitNew,
        formState: { errors: errorsNew },
    } = useForm({ resolver: yupResolver(newEmailSchema) });

    // Step 1: Kirim kode ke email lama
    const handleSendCodeToCurrent = async (data) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("user_token");
            const res = await fetch("/api/email/send-code-current", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(data),
            });
            const result = await res.json();
            if (res.ok) {
                setCurrentEmail(data.email);
                setStep(2);
                Swal.fire("Success", result.message, "success");
            } else {
                Swal.fire("Error", result.message, "error");
            }
        } catch (err) {
            Swal.fire("Error", "Gagal menghubungi server.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Verifikasi kode email lama
    const handleVerifyCurrentCode = async (data) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("user_token");
            const res = await fetch("/api/email/verify-current", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(data),
            });
            const result = await res.json();
            if (res.ok) {
                setStep(3);
                Swal.fire("Success", result.message, "success");
            } else {
                Swal.fire("Error", result.message, "error");
            }
        } catch (err) {
            Swal.fire("Error", "Gagal verifikasi kode.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Step 3: Kirim kode ke email baru
    const handleSendCodeToNew = async (data) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("user_token");
            const res = await fetch("/api/email/send-code-new", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(data),
            });
            const result = await res.json();
            if (res.ok) {
                setNewEmail(data.new_email);
                setStep(4);
                Swal.fire("Success", result.message, "success");
            } else {
                Swal.fire("Error", result.message, "error");
            }
        } catch (err) {
            Swal.fire("Error", "Gagal mengirim ke email baru.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Step 4: Verifikasi kode email baru → ganti email
    const handleVerifyNewCode = async (data) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("user_token");
            const res = await fetch("/api/email/verify-new", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(data),
            });
            const result = await res.json();
            if (res.ok) {
                Swal.fire({
                    icon: "success",
                    title: "Email Berhasil Diubah!",
                    text: `Silakan login dengan email: ${result.email}`,
                }).then(() => {
                    localStorage.removeItem("user_token");
                    window.location.href = "/login";
                });
            } else {
                Swal.fire("Error", result.message, "error");
            }
        } catch (err) {
            Swal.fire("Error", "Gagal mengganti email.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="h-screen w-full bg-cover bg-center user-select-none overflow-hidden"
            style={{ backgroundImage: `url(${EmailBG})` }}
        >
            {isLoading && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
                    <Loading />
                </div>
            )}
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-center mb-6">
                        {step === 1 && "Ganti Email"}
                        {step === 2 && "Verifikasi Email Saat Ini"}
                        {step === 3 && "Masukkan Email Baru"}
                        {step === 4 && "Verifikasi Email Baru"}
                    </h2>

                    {step === 1 && (
                        <form onSubmit={handleSubmitCurrent(handleSendCodeToCurrent)} className="space-y-6">
                            <div className="relative">
                                <Input
                                    type="email"
                                    placeholder="Email Saat Ini"
                                    {...registerCurrent("email")}
                                    className={`w-full px-4 py-6 rounded-lg border ${errorsCurrent.email ? "border-red-500" : "border-gray-300"}`}
                                />
                                {errorsCurrent.email && (
                                    <p className="text-red-500 text-sm mt-1">{errorsCurrent.email.message}</p>
                                )}
                            </div>
                            <Button type="submit" disabled={isLoading} className="w-full bg-black text-white py-4 cursor-pointer">
                                Kirim Kode Verifikasi
                            </Button>
                            <div className="text-center ">
                                <a
                                    href="/"
                                    className="text-gray-700 hover:text-gray-900 hover:underline text-sm font-medium cursor-pointer"
                                >
                                    Kembali ke Halaman Utama
                                </a>
                            </div>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleSubmitCode(handleVerifyCurrentCode)} className="space-y-6">
                            <p className="text-center text-gray-600">
                                Masukkan kode 6 digit yang dikirim ke <strong>{currentEmail}</strong>
                            </p>
                            <Input
                                type="text"
                                placeholder="Kode Verifikasi"
                                {...registerCode("code")}
                                className={errorsCode.code ? "border-red-500" : ""}
                            />
                            {errorsCode.code && (
                                <p className="text-red-500 text-sm">{errorsCode.code.message}</p>
                            )}
                            <div className="flex gap-3">
                                <Button type="button" onClick={() => setStep(1)} className="flex-1 bg-gray-300 cursor-pointer">
                                    Kembali
                                </Button>
                                <Button type="submit" disabled={isLoading} className="flex-1 bg-black text-white cursor-pointer">
                                    Verifikasi
                                </Button>
                            </div>
                        </form>
                    )}

                    {step === 3 && (
                        <form onSubmit={handleSubmitNew(handleSendCodeToNew)} className="space-y-6">
                            <Input
                                type="email"
                                placeholder="Email Baru"
                                {...registerNew("new_email")}
                                className={errorsNew.new_email ? "border-red-500" : ""}
                            />
                            {errorsNew.new_email && (
                                <p className="text-red-500 text-sm">{errorsNew.new_email.message}</p>
                            )}
                            <div className="flex gap-3">
                                <Button type="button" onClick={() => setStep(2)} className="flex-1 bg-gray-300 cursor-pointer">
                                    Kembali
                                </Button>
                                <Button type="submit" disabled={isLoading} className="flex-1 bg-black text-white cursor-pointer">
                                    Kirim Kode ke Email Baru
                                </Button>
                            </div>
                        </form>
                    )}

                    {step === 4 && (
                        <form onSubmit={handleSubmitCode(handleVerifyNewCode)} className="space-y-6">
                            <p className="text-center text-gray-600">
                                Masukkan kode 6 digit yang dikirim ke <strong>{newEmail}</strong>
                            </p>
                            <Input
                                type="text"
                                placeholder="Kode Verifikasi"
                                {...registerCode("code")}
                                className={errorsCode.code ? "border-red-500" : ""}
                            />
                            {errorsCode.code && (
                                <p className="text-red-500 text-sm">{errorsCode.code.message}</p>
                            )}
                            <div className="flex gap-3">
                                <Button type="button" onClick={() => setStep(3)} className="flex-1 bg-gray-300 cursor-pointer">
                                    Kembali
                                </Button>
                                <Button type="submit" disabled={isLoading} className="flex-1 bg-black text-white cursor-pointer">
                                    Konfirmasi & Ganti Email
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}