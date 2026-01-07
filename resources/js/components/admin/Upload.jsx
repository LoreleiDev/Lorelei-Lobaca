import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Card } from "../../components/ui/card";
import { Upload } from "lucide-react";
import Sidebar from "./ui/Sidebar";
import Loading from "../ui/Loading";

export default function BookUpload() {
    document.title = "Upload - Lobaca Admin";
    const [formData, setFormData] = useState({
        judul: "",
        penulis: "",
        penerbit: "",
        stok: "",
        kondisi: "",
        kategori: [], 
        foto: null,
        deskripsi: "",
        harga: "",
        berat: "",
        isbn: "",
        tahun: new Date().getFullYear().toString(),
        admin_id: "",
    });

    const [preview, setPreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingAdmin, setLoadingAdmin] = useState(true);
    const [showUploadLoading, setShowUploadLoading] = useState(false);

    const showToast = (icon, title) => {
        Swal.fire({
            toast: true,
            position: "top-end",
            icon: icon,
            title: title,
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true,
            background: "#1e293b",
            color: "#f1f5f9",
        });
    };

    useEffect(() => {
        const fetchAdminData = async () => {
            const token = localStorage.getItem("admin_token");
            if (!token) {
                showToast("error", "Sesi tidak valid. Silakan login.");
                setLoadingAdmin(false);
                return;
            }

            try {
                const res = await fetch("/api/admin/me", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                });

                if (res.ok) {
                    const response = await res.json();
                    const admin = response.admin;
                    setFormData((prev) => ({
                        ...prev,
                        admin_id: admin?.admin_id
                            ? admin.admin_id.toString()
                            : "",
                    }));
                } else {
                    showToast("error", "Gagal memuat data admin.");
                }
            } catch (error) {
                showToast("error", "Koneksi gagal. Coba lagi.");
            } finally {
                setLoadingAdmin(false);
            }
        };

        fetchAdminData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!validateImageFile(file)) return;
            setFormData((prev) => ({ ...prev, foto: file }));
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add("border-primary");
    };

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove("border-primary");
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove("border-primary");
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/")) {
            if (!validateImageFile(file)) return;
            setFormData((prev) => ({ ...prev, foto: file }));
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const validateImageFile = (file) => {
        const validTypes = ["image/jpeg", "image/webp", "image/png"];
        const maxSize = 1 * 1024 * 1024;

        if (!validTypes.includes(file.type)) {
            showToast(
                "error",
                "Format gambar tidak didukung. Mohon gunakan format JPG, WebP atau PNG."
            );
            return false;
        }

        if (file.size > maxSize) {
            showToast("error", "Ukuran gambar terlalu besar. Maksimal 1 MB.");
            return false;
        }

        return true;
    };

    const validateForm = () => {
        const required = [
            "judul",
            "penulis",
            "penerbit",
            "stok",
            "harga",
            "tahun",
            "kondisi",
        ];
        for (const field of required) {
            if (!formData[field]?.toString().trim()) {
                showToast("error", `Kolom "${field}" wajib diisi.`);
                return false;
            }
        }

        if (formData.kategori.length === 0) {
            showToast("error", "Pilih minimal satu kategori.");
            return false;
        }

        if (isNaN(formData.stok) || parseInt(formData.stok) < 0) {
            showToast("error", "Stok harus berupa angka dan minimal 0.");
            return false;
        }

        if (isNaN(formData.harga) || parseInt(formData.harga) < 1000) {
            showToast("error", "Harga minimal Rp1.000.");
            return false;
        }

        if (
            formData.tahun &&
            (parseInt(formData.tahun) < 1900 ||
                parseInt(formData.tahun) > new Date().getFullYear())
        ) {
            showToast("error", "Tahun terbit tidak valid.");
            return false;
        }

        return true;
    };

    const deleteFromCloudinary = async (fotoUrl) => {
        const adminToken = localStorage.getItem("admin_token");
        if (!adminToken || !fotoUrl) return;

        try {
            await fetch("/api/admin/books/cleanup-image", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${adminToken}`,
                },
                body: JSON.stringify({ foto_url: fotoUrl }),
            });
        } catch (err) {}
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        setShowUploadLoading(true);
        const adminToken = localStorage.getItem("admin_token");
        if (!adminToken || !formData.admin_id) {
            showToast("error", "Sesi admin tidak valid.");
            setIsLoading(false);
            setShowUploadLoading(false);
            return;
        }

        let fotoUrl = null;

        try {
            if (formData.foto instanceof File) {
                const cloudName = "dvwp7mgic";
                const uploadPreset = "Lobaca Books";

                const formDataCloud = new FormData();
                formDataCloud.append("file", formData.foto);
                formDataCloud.append("upload_preset", uploadPreset);
                formDataCloud.append(
                    "folder",
                    `books/admin_${formData.admin_id}`
                );

                const res = await fetch(
                    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                    {
                        method: "POST",
                        body: formDataCloud,
                    }
                );

                if (!res.ok) throw new Error("Gagal upload ke Cloudinary");

                const data = await res.json();
                fotoUrl = data.secure_url;
            }

            const payload = {
                judul: formData.judul,
                penulis: formData.penulis,
                penerbit: formData.penerbit,
                stok: parseInt(formData.stok, 10),
                kondisi: formData.kondisi,
                kategori: formData.kategori.join(","), 
                foto: fotoUrl,
                deskripsi: formData.deskripsi,
                harga: parseInt(formData.harga, 10),
                berat: formData.berat ? parseInt(formData.berat, 10) : null,
                isbn: formData.isbn,
                tahun: parseInt(formData.tahun, 10),
                admin_id: parseInt(formData.admin_id, 10),
            };

            const response = await fetch("/api/admin/books", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${adminToken}`,
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                showToast("success", "Buku berhasil ditambahkan!");
                setFormData({
                    judul: "",
                    penulis: "",
                    penerbit: "",
                    stok: "",
                    kondisi: "",
                    kategori: [], 
                    foto: null,
                    deskripsi: "",
                    harga: "",
                    berat: "",
                    isbn: "",
                    tahun: new Date().getFullYear().toString(),
                    admin_id: formData.admin_id,
                });
                setPreview(null);
            } else {
                if (fotoUrl) {
                    deleteFromCloudinary(fotoUrl);
                }
                const errorData = await response.json().catch(() => ({}));
                const errorMsg =
                    errorData.message || "Gagal menambahkan buku. Coba lagi!";
                showToast("error", errorMsg);
            }
        } catch (error) {
            if (fotoUrl) {
                deleteFromCloudinary(fotoUrl);
            }
            showToast(
                "error",
                error.message || "Terjadi kesalahan saat upload."
            );
        } finally {
            setIsLoading(false);
            setShowUploadLoading(false);
        }
    };

    if (loadingAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loading />
            </div>
        );
    }

    return (
        <Sidebar>
            {showUploadLoading && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
                    <Loading />
                </div>
            )}

            <Card className="border border-border bg-card p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label className="text-base font-semibold mb-3 block">
                            Foto Sampul Buku
                        </Label>
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className="relative border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer bg-muted/30"
                        >
                            <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {preview ? (
                                <div className="flex flex-col items-center gap-3">
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="h-32 object-cover rounded"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Klik atau drag untuk mengganti
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                    <p className="font-medium">
                                        Drag foto di sini atau klik untuk
                                        memilih
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Format: webp, PNG | Maks: 1 MB
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="judul">Judul Buku *</Label>
                            <Input
                                id="judul"
                                name="judul"
                                value={formData.judul}
                                onChange={handleInputChange}
                                placeholder="Masukkan judul buku"
                                required
                                className="mt-2"
                            />
                        </div>

                        {/* --- MULTI-KATEGORI (CHECKBOX) --- */}
                        <div className="md:col-span-2">
                            <Label className="text-sm font-medium">
                                Kategori *
                                <span className="text-xs text-muted-foreground ml-2">
                                    (Pilih satu atau lebih)
                                </span>
                            </Label>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {[
                                    { value: "fiksi", label: "Fiksi" },
                                    { value: "non_fiksi", label: "Non-Fiksi" },
                                    {
                                        value: "seni_kreatif",
                                        label: "Seni & Kreatif",
                                    },
                                    {
                                        value: "gaya_hidup",
                                        label: "Gaya Hidup",
                                    },
                                    {
                                        value: "pendidikan",
                                        label: "Pendidikan",
                                    },
                                    { value: "buku_anak", label: "Buku Anak" },
                                    { value: "komik", label: "Komik" },
                                    { value: "novel", label: "Novel" },
                                    { value: "majalah", label: "Majalah" },
                                ].map((item) => (
                                    <label
                                        key={item.value}
                                        className="flex items-center space-x-2 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            value={item.value}
                                            checked={formData.kategori.includes(
                                                item.value
                                            )}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => {
                                                    if (e.target.checked) {
                                                        return {
                                                            ...prev,
                                                            kategori: [
                                                                ...prev.kategori,
                                                                value,
                                                            ],
                                                        };
                                                    } else {
                                                        return {
                                                            ...prev,
                                                            kategori:
                                                                prev.kategori.filter(
                                                                    (k) =>
                                                                        k !==
                                                                        value
                                                                ),
                                                        };
                                                    }
                                                });
                                            }}
                                            className="rounded border-border text-primary focus:ring-primary"
                                        />
                                        <span className="text-foreground">
                                            {item.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="penulis">Penulis *</Label>
                            <Input
                                id="penulis"
                                name="penulis"
                                value={formData.penulis}
                                onChange={handleInputChange}
                                placeholder="Masukkan nama penulis"
                                required
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <Label htmlFor="penerbit">Penerbit *</Label>
                            <Input
                                id="penerbit"
                                name="penerbit"
                                value={formData.penerbit}
                                onChange={handleInputChange}
                                placeholder="Masukkan nama penerbit"
                                required
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <Label htmlFor="isbn">ISBN</Label>
                            <Input
                                id="isbn"
                                name="isbn"
                                value={formData.isbn}
                                onChange={handleInputChange}
                                placeholder="978-0-123456-78-9"
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <Label htmlFor="tahun">Tahun Terbit *</Label>
                            <Input
                                id="tahun"
                                name="tahun"
                                type="number"
                                value={formData.tahun}
                                onChange={handleInputChange}
                                required
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <Label htmlFor="stok">Stok *</Label>
                            <Input
                                id="stok"
                                name="stok"
                                type="number"
                                value={formData.stok}
                                onChange={handleInputChange}
                                required
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <Label htmlFor="harga">Harga (Rp) *</Label>
                            <Input
                                id="harga"
                                name="harga"
                                type="number"
                                value={formData.harga}
                                onChange={handleInputChange}
                                required
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <Label htmlFor="berat">Berat (gram)</Label>
                            <Input
                                id="berat"
                                name="berat"
                                type="number"
                                value={formData.berat}
                                onChange={handleInputChange}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <Label htmlFor="kondisi">Kondisi *</Label>
                            <select
                                id="kondisi"
                                name="kondisi"
                                value={formData.kondisi}
                                onChange={handleInputChange}
                                required
                                className="mt-2 w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                                <option value="">-- Pilih Kondisi --</option>
                                <option value="baru">Baru</option>
                                <option value="baik">Baik</option>
                                <option value="cukup">Cukup</option>
                                <option value="rusak">Rusak</option>
                                <option value="minus">Minus</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="deskripsi">Deskripsi</Label>
                        <Textarea
                            id="deskripsi"
                            name="deskripsi"
                            value={formData.deskripsi}
                            onChange={handleInputChange}
                            placeholder="Masukkan deskripsi buku..."
                            rows={4}
                            className="mt-2"
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-border">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setFormData({
                                    judul: "",
                                    penulis: "",
                                    penerbit: "",
                                    stok: "",
                                    kondisi: "",
                                    kategori: [],
                                    foto: null,
                                    deskripsi: "",
                                    harga: "",
                                    berat: "",
                                    isbn: "",
                                    tahun: new Date().getFullYear().toString(),
                                    admin_id: formData.admin_id,
                                });
                                setPreview(null);
                                showToast("info", "Formulir direset.");
                            }}
                            className={"cursor-pointer"}
                        >
                            Reset
                        </Button>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className={"cursor-pointer"}
                        >
                            {isLoading ? "Mengunggah..." : "Upload Buku"}
                        </Button>
                    </div>
                </form>
            </Card>
        </Sidebar>
    );
}
