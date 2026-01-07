import React, { useState, useRef, useEffect } from "react";
import { Button } from "../button";
import { Input } from "../input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../dialog";
import { Upload, X, AlertCircle } from "lucide-react";
import { uploadToCloudinary } from "@/lib/uploadAvatar";

export default function EditProfileModal({
    isOpen,
    onClose,
    onSave,
    currentProfile,
}) {
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        phone: "",
        avatar: "",
    });
    const [errors, setErrors] = useState({});
    const [previewImage, setPreviewImage] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen && currentProfile) {
            const names = currentProfile.name?.trim().split(" ") || [];
            const first = names[0] || "";
            const last = names.slice(1).join(" ") || "";

            setFormData({
                first_name: first,
                last_name: last,
                phone: currentProfile.phone || "",
                avatar: currentProfile.avatar || "",
            });
            setPreviewImage(null);
            setSelectedFile(null);
            setErrors({});
            setSaveError("");
        }
    }, [isOpen, currentProfile]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.first_name.trim()) {
            newErrors.first_name = "Nama depan wajib diisi";
        }

        if (!formData.last_name.trim()) {
            newErrors.last_name = "Nama belakang wajib diisi";
        }

        if (!formData.phone.trim()) {
            newErrors.phone = "Nomor telepon wajib diisi";
        } else if (!/^[\+]?[0-9\s\-\(\)]{8,20}$/.test(formData.phone.trim())) {
            newErrors.phone = "Format nomor telepon tidak valid";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setSaveError("File harus berupa gambar");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setSaveError("Ukuran file maksimal 5MB");
            return;
        }

        setSaveError("");

        const reader = new FileReader();
        reader.onload = (e) => {
            setPreviewImage(e.target.result);
        };
        reader.readAsDataURL(file);

        setSelectedFile(file);
    };

    const handleRemoveImage = () => {
        setPreviewImage(null);
        setSelectedFile(null);
        setFormData((prev) => ({
            ...prev,
            avatar: currentProfile.avatar || "",
        }));
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));

        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: null }));
        }
        if (saveError) {
            setSaveError("");
        }
    };

    const handleSave = async () => {
        if (!validateForm()) {
            setSaveError("Terdapat kesalahan dalam pengisian form");
            return;
        }

        const token = localStorage.getItem("user_token");
        if (!token) {
            setSaveError("Sesi tidak valid. Silakan login ulang.");
            return;
        }

        setIsSaving(true);
        setSaveError("");
        try {
            let newAvatarUrl = formData.avatar;

            if (selectedFile) {
                setIsUploading(true);
                try {
                    const userId = currentProfile.id;
                    const fileName = `${Date.now()}_${selectedFile.name.replace(
                        /\s+/g,
                        "_"
                    )}`;

                    newAvatarUrl = await uploadToCloudinary(
                        selectedFile,
                        "avatars",
                        `${userId}/${fileName}`
                    );
                } catch (uploadError) {
                    throw new Error(
                        "Gagal mengupload foto profil: " + uploadError.message
                    );
                } finally {
                    setIsUploading(false);
                }
            }

            const profileData = {
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
                email: currentProfile.email,
                phone: formData.phone.trim(),
                avatar: newAvatarUrl,
                old_avatar_url: currentProfile.avatar,
            };

            const profileResponse = await fetch(`/api/profile`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(profileData),
            });

            const contentType = profileResponse.headers.get("content-type");
            let responseData;

            if (contentType && contentType.includes("application/json")) {
                responseData = await profileResponse.json();
            } else {
                throw new Error(`Server error: ${profileResponse.status}`);
            }

            if (!profileResponse.ok) {
                if (profileResponse.status === 422 && responseData.errors) {
                    const validationErrors = Object.values(responseData.errors)
                        .flat()
                        .join(", ");
                    throw new Error(validationErrors);
                }
                throw new Error(
                    responseData.message || `Error ${profileResponse.status}`
                );
            }

            const fullName =
                `${formData.first_name} ${formData.last_name}`.trim();
            onSave({
                ...currentProfile,
                name: fullName,
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone: formData.phone.trim(),
                avatar: newAvatarUrl,
            });

            onClose();
        } catch (err) {
            setSaveError(err.message || "Gagal menyimpan perubahan.");
        } finally {
            setIsSaving(false);
        }
    };

    const displayImage = previewImage || formData.avatar || "/placeholder.svg";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="sm:max-w-md bg-zinc-900 border-2 border-yellow-400"
                onInteractOutside={(e) => {
                    if (!isSaving && !isUploading) {
                        onClose();
                    } else {
                        e.preventDefault();
                    }
                }}
            >
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-yellow-400">
                        Edit Profil
                    </DialogTitle>
                    <DialogDescription className="text-yellow-100">
                        Perbarui informasi profil Anda
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative w-32 h-32 border-2 border-yellow-400 bg-zinc-800 overflow-hidden rounded-full">
                            <img
                                src={displayImage}
                                alt="Preview"
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                    e.target.src = "/placeholder.svg";
                                }}
                            />
                            {previewImage && (
                                <div className="absolute inset-0 bg-opacity-50 flex items-center justify-center">
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading || isSaving}
                                className="gap-2 border-yellow-500 bg-yellow-500 text-black hover:bg-amber-400 cursor-pointer"
                            >
                                <Upload className="w-4 h-4" /> Pilih Foto
                            </Button>

                            {previewImage && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRemoveImage}
                                    disabled={isUploading || isSaving}
                                    className="gap-2 border-red-500 text-red-500 hover:bg-red-500/10 bg-transparent cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                    Batalkan
                                </Button>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                            disabled={isUploading || isSaving}
                        />
                    </div>

                    {/* Form inputs */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-yellow-400 uppercase">
                                Nama Depan *
                            </label>
                            <Input
                                type="text"
                                value={formData.first_name}
                                onChange={(e) =>
                                    handleInputChange(
                                        "first_name",
                                        e.target.value
                                    )
                                }
                                placeholder="Nama depan"
                                className={`h-10 bg-zinc-800 border-2 text-white placeholder:text-yellow-300/50 focus:border-yellow-300 ${errors.first_name
                                        ? "border-red-500"
                                        : "border-yellow-400"
                                    }`}
                                disabled={isSaving}
                            />
                            {errors.first_name && (
                                <p className="text-red-400 text-sm">
                                    {errors.first_name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-yellow-400 uppercase">
                                Nama Belakang *
                            </label>
                            <Input
                                type="text"
                                value={formData.last_name}
                                onChange={(e) =>
                                    handleInputChange(
                                        "last_name",
                                        e.target.value
                                    )
                                }
                                placeholder="Nama belakang"
                                className={`h-10 bg-zinc-800 border-2 text-white placeholder:text-yellow-300/50 focus:border-yellow-300 ${errors.last_name
                                        ? "border-red-500"
                                        : "border-yellow-400"
                                    }`}
                                disabled={isSaving}
                            />
                            {errors.last_name && (
                                <p className="text-red-400 text-sm">
                                    {errors.last_name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-yellow-400 uppercase">
                                Nomor Telepon *
                            </label>
                            <Input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) =>
                                    handleInputChange("phone", e.target.value)
                                }
                                placeholder="Contoh: 081234567890"
                                className={`h-10 bg-zinc-800 border-2 text-white placeholder:text-yellow-300/50 focus:border-yellow-300 ${errors.phone
                                        ? "border-red-500"
                                        : "border-yellow-400"
                                    }`}
                                disabled={isSaving}
                            />
                            {errors.phone && (
                                <p className="text-red-400 text-sm">
                                    {errors.phone}
                                </p>
                            )}
                        </div>
                    </div>

                    {saveError && (
                        <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-500 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                            <p className="text-red-400 text-sm">{saveError}</p>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 justify-end">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isSaving || isUploading}
                        className="border-yellow-400 text-yellow-400 hover:bg-amber-400 bg-transparent cursor-pointer"
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isUploading || isSaving}
                        className="cursor-pointer bg-linear-to-r from-yellow-400 to-yellow-300 text-zinc-900 font-bold hover:from-yellow-300 hover:to-yellow-200 disabled:opacity-50"
                    >
                        {isUploading || isSaving
                            ? "Menyimpan..."
                            : "Simpan Perubahan"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}