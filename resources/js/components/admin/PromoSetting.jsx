import { useState, useEffect } from "react";
import {
    Plus,
    Trash2,
    Edit3,
    Calendar,
    Clock,
    BookOpen,
    Tag,
    Search,
} from "lucide-react";
import { Button } from "../ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { PromoForm } from "./ui/PromoForm";
import Sidebar from "./ui/Sidebar";
import Swal from "sweetalert2";
import Loading from "../ui/Loading";
import { Badge } from "../ui/badge";

export default function PromoAdminPage() {
    document.title = "Promo - Lobaca Admin";
    const [promos, setPromos] = useState([]);
    const [filteredPromos, setFilteredPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState("list");
    const [editingPromo, setEditingPromo] = useState(null);
    const [temporaryImageUrls, setTemporaryImageUrls] = useState(new Set());

    const fetchPromos = async () => {
        const token = localStorage.getItem("admin_token");
        const res = await fetch("/api/admin/promos", {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const data = await res.json();
            setPromos(data);
            setFilteredPromos(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPromos();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredPromos(promos);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = promos.filter(
                (promo) =>
                    promo.name.toLowerCase().includes(query) ||
                    promo.books.some(
                        (book) =>
                            book.title.toLowerCase().includes(query) ||
                            book.author.toLowerCase().includes(query)
                    )
            );
            setFilteredPromos(filtered);
        }
    }, [searchQuery, promos]);

    const uploadImageToCloudinary = async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "Lobaca Promo");
        formData.append("cloud_name", "dvwp7mgic");
        formData.append("folder", "promos");
        try {
            const response = await fetch("https://api.cloudinary.com/v1_1/dvwp7mgic/image/upload", {
                method: "POST",
                body: formData,
            });
            const data = await response.json();
            if (data.secure_url) {
                setTemporaryImageUrls((prev) => new Set([...prev, data.secure_url]));
                return data.secure_url;
            } else {
                throw new Error(data.error?.message || "Upload gagal");
            }
        } catch (error) {
            console.error("Cloudinary upload error:", error);
            Swal.fire({
                title: "Gagal Upload Gambar",
                text: error.message || "Terjadi kesalahan saat mengunggah gambar.",
                icon: "error",
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 4000,
                background: "#1e293b",
                color: "#f1f5f9",
            });
            return null;
        }
    };

    const deleteImageFromCloudinary = async (imageUrl) => {
        if (!imageUrl) return;
        const token = localStorage.getItem("admin_token");
        try {
            const res = await fetch("/api/admin/promos/cleanup-image", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ foto_url: imageUrl }),
            });
            if (!res.ok) {
                console.warn("Gagal menghapus gambar dari Cloudinary:", imageUrl);
            }
        } catch (error) {
            console.error("Error saat menghapus gambar:", error);
        }
    };

    const handleSavePromo = async (promoData) => {
        const token = localStorage.getItem("admin_token");
        const url = editingPromo
            ? `/api/admin/promos/${editingPromo.id}`
            : `/api/admin/promos`;
        const method = editingPromo ? "PUT" : "POST";
        let finalImageUrl = promoData.image_url || null;
        let uploadedImageUrl = null;

        if (promoData.imageFile) {
            const uploadedUrl = await uploadImageToCloudinary(promoData.imageFile);
            if (!uploadedUrl) return;
            uploadedImageUrl = uploadedUrl;
            finalImageUrl = uploadedUrl;
        }

        const payload = {
            ...promoData,
            image_url: finalImageUrl,
            imageFile: undefined,
        };

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                if (editingPromo && editingPromo.imageUrl && finalImageUrl !== editingPromo.imageUrl) {
                    await deleteImageFromCloudinary(editingPromo.imageUrl);
                }

                if (uploadedImageUrl) {
                    setTemporaryImageUrls((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(uploadedImageUrl);
                        return newSet;
                    });
                }

                await fetchPromos();
                setViewMode("list");
                setEditingPromo(null);

                Swal.fire({
                    title: "Promo Disimpan",
                    icon: "success",
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    background: "#1e293b",
                    color: "#f1f5f9",
                });
            } else {
                const errorData = await res.json().catch(() => ({}));
                if (uploadedImageUrl) {
                    await deleteImageFromCloudinary(uploadedImageUrl);
                    setTemporaryImageUrls((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(uploadedImageUrl);
                        return newSet;
                    });
                }
                Swal.fire({
                    title: "Gagal Menyimpan",
                    text: errorData.message || "Coba lagi.",
                    icon: "error",
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 5000,
                    timerProgressBar: true,
                    background: "#1e293b",
                    color: "#f1f5f9",
                });
            }
        } catch (error) {
            console.error("Error jaringan saat menyimpan promo:", error);
            if (uploadedImageUrl) {
                await deleteImageFromCloudinary(uploadedImageUrl);
                setTemporaryImageUrls((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(uploadedImageUrl);
                    return newSet;
                });
            }
            Swal.fire({
                title: "Error",
                text: "Gagal terhubung ke server.",
                icon: "error",
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 5000,
                timerProgressBar: true,
                background: "#1e293b",
                color: "#f1f5f9",
            });
        }
    };

    const handleDeletePromo = async (id) => {
        const promoToDelete = promos.find((p) => p.id === id);
        const imageUrl = promoToDelete?.imageUrl;

        const result = await Swal.fire({
            title: "Hapus Promo?",
            text: "Tindakan ini tidak dapat dibatalkan!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Ya, hapus!",
        });
        if (!result.isConfirmed) return;

        setLoading(true);

        const token = localStorage.getItem("admin_token");
        try {
            const res = await fetch(`/api/admin/promos/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                if (imageUrl) {
                    await deleteImageFromCloudinary(imageUrl);
                }
                await fetchPromos();
                Swal.fire({
                    icon: "success",
                    title: "Promo dihapus",
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    background: "#1e293b",
                    color: "#f1f5f9",
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Gagal menghapus promo",
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    background: "#1e293b",
                    color: "#f1f5f9",
                });
            }
        } catch (error) {
            console.error("Error menghapus promo:", error);
            Swal.fire({
                icon: "error",
                title: "Terjadi kesalahan",
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                background: "#1e293b",
                color: "#f1f5f9",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEditPromo = (promo) => {
        setEditingPromo(promo);
        setViewMode("form");
    };

    const handleCancelForm = () => {
        // Hanya hapus gambar sementara yang di-upload tapi belum disimpan
        if (editingPromo) {
            const tempUrl = Array.from(temporaryImageUrls).find(
                (url) => url !== editingPromo.imageUrl
            );
            if (tempUrl) {
                deleteImageFromCloudinary(tempUrl);
                setTemporaryImageUrls((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(tempUrl);
                    return newSet;
                });
            }
        }
        setViewMode("list");
        setEditingPromo(null);
    };

    const getPromoStatus = (startDate, endDate, startTime, endTime) => {
        const now = new Date();
        const start = new Date(`${startDate}T${startTime}`);
        const end = new Date(`${endDate}T${endTime}`);
        if (now < start) return "upcoming";
        if (now > end) return "expired";
        return "active";
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "active":
                return "bg-green-100 text-green-800 border-green-200";
            case "upcoming":
                return "bg-blue-100 text-blue-800 border-blue-200";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case "active":
                return "Sedang Berjalan";
            case "upcoming":
                return "Akan Datang";
            default:
                return "Tidak Diketahui";
        }
    };

    // ❌ Dihapus: jangan pernah hapus semua temporaryImageUrls saat unmount
    // useEffect(() => {
    //     return () => {
    //         temporaryImageUrls.forEach((url) => {
    //             deleteImageFromCloudinary(url);
    //         });
    //     };
    // }, [temporaryImageUrls]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loading />
            </div>
        );
    }

    // Mode Form
    if (viewMode === "form") {
        return (
            <Sidebar>
                <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 p-4 sm:p-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-6 flex items-center justify-between">
                            <h1 className="text-2xl font-bold">
                                {editingPromo ? "Edit Promo" : "Buat Promo Baru"}
                            </h1>
                            <Button
                                variant="outline"
                                onClick={handleCancelForm}
                                className="cursor-pointer"
                            >
                                Batal
                            </Button>
                        </div>
                        <PromoForm
                            initialPromo={editingPromo}
                            onSave={handleSavePromo}
                            onCancel={handleCancelForm}
                            onImageUpload={uploadImageToCloudinary}
                            cloudName="dvwp7mgic"
                        />
                    </div>
                </div>
            </Sidebar>
        );
    }

    // Mode List
    return (
        <Sidebar>
            <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 p-4 sm:p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 sm:mb-8">
                        <div className="mb-4 lg:mb-0">
                            <div className="flex items-center gap-3 mb-2">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                                        Manajemen Promo
                                    </h1>
                                    <p className="text-muted-foreground text-sm sm:text-lg mt-1">
                                        Kelola semua promo dan diskon buku Anda dengan mudah
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={() => {
                                setEditingPromo(null);
                                setViewMode("form");
                            }}
                            className="gap-2 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 bg-purple-600 border-0 w-full sm:w-auto"
                        >
                            <Plus className="w-4 h-4" />
                            Tambah Promo Baru
                        </Button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 sm:mb-8">
                        <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-green-500 shadow-lg">
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Total Promo</p>
                                        <p className="text-lg sm:text-xl font-bold">{promos.length}</p>
                                    </div>
                                    <div className="p-2 bg-green-100 rounded-full">
                                        <Tag className="w-4 h-4 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-blue-500 shadow-lg">
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Promo Aktif</p>
                                        <p className="text-lg sm:text-xl font-bold">
                                            {promos.filter((promo) => getPromoStatus(promo.startDate, promo.endDate, promo.startTime, promo.endTime) === "active").length}
                                        </p>
                                    </div>
                                    <div className="p-2 bg-blue-100 rounded-full">
                                        <Calendar className="w-4 h-4 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-orange-500 shadow-lg">
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Akan Datang</p>
                                        <p className="text-lg sm:text-xl font-bold">
                                            {promos.filter((promo) => getPromoStatus(promo.startDate, promo.endDate, promo.startTime, promo.endTime) === "upcoming").length}
                                        </p>
                                    </div>
                                    <div className="p-2 bg-orange-100 rounded-full">
                                        <Clock className="w-4 h-4 text-orange-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-purple-500 shadow-lg">
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Total Buku</p>
                                        <p className="text-lg sm:text-xl font-bold">
                                            {promos.reduce((total, promo) => total + promo.books.length, 0)}
                                        </p>
                                    </div>
                                    <div className="p-2 bg-purple-100 rounded-full">
                                        <BookOpen className="w-4 h-4 text-purple-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative w-full sm:max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 sm:w-5 sm:h-5 z-10" />
                            <input
                                type="text"
                                placeholder="Cari promo atau buku..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white/80 text-sm sm:text-base shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Promo List */}
                    {filteredPromos.length === 0 ? (
                        <Card className="text-center py-12 sm:py-16 bg-white/80 backdrop-blur-sm shadow-xl border-0">
                            <CardContent>
                                <div className="max-w-md mx-auto">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
                                        <Tag className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-semibold mb-2">
                                        {searchQuery ? "Promo Tidak Ditemukan" : "Belum Ada Promo"}
                                    </h3>
                                    <p className="text-muted-foreground text-sm sm:text-base mb-6">
                                        {searchQuery
                                            ? `Tidak ada promo yang sesuai dengan pencarian "${searchQuery}"`
                                            : "Mulai buat promo pertama Anda untuk menarik lebih banyak pembaca!"}
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                        {!searchQuery && (
                                            <Button
                                                onClick={() => {
                                                    setEditingPromo(null);
                                                    setViewMode("form");
                                                }}
                                                className="gap-2 cursor-pointer"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Buat Promo Pertama
                                            </Button>
                                        )}
                                        {searchQuery && (
                                            <Button
                                                onClick={() => setSearchQuery("")}
                                                variant="outline"
                                                className="gap-2 cursor-pointer"
                                            >
                                                Tampilkan Semua Promo
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 sm:gap-6">
                            {filteredPromos.map((promo) => {
                                const status = getPromoStatus(promo.startDate, promo.endDate, promo.startTime, promo.endTime);
                                return (
                                    <Card
                                        key={promo.id}
                                        className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm group"
                                    >
                                        <div
                                            className={`absolute top-0 left-0 w-1 h-full ${status === "active"
                                                    ? "bg-green-500"
                                                    : status === "upcoming"
                                                        ? "bg-blue-500"
                                                        : "bg-gray-400"
                                                }`}
                                        />
                                        <CardHeader className="pb-3 relative">
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                                        <CardTitle className="text-lg sm:text-xl group-hover:text-primary transition-colors truncate">
                                                            {promo.name}
                                                        </CardTitle>
                                                        <Badge className={`${getStatusColor(status)} border w-fit`}>
                                                            {getStatusText(status)}
                                                        </Badge>
                                                    </div>
                                                    <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-wrap">
                                                        <span className="flex items-center gap-1 text-xs sm:text-sm">
                                                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                                                            {new Date(promo.startDate).toLocaleDateString("id-ID")} -{" "}
                                                            {new Date(promo.endDate).toLocaleDateString("id-ID")}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-xs sm:text-sm">
                                                            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                                            {promo.startTime} - {promo.endTime}
                                                        </span>
                                                    </CardDescription>
                                                </div>
                                                <div className="flex gap-2 justify-end sm:justify-start">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEditPromo(promo)}
                                                        className="cursor-pointer gap-1 border-primary/20 text-primary hover:bg-primary hover:text-white transition-colors text-xs"
                                                    >
                                                        <Edit3 className="w-3 h-3" />
                                                        <span className="hidden sm:inline">Edit</span>
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDeletePromo(promo.id)}
                                                        className="cursor-pointer gap-1 text-xs"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                        <span className="hidden sm:inline">Hapus</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {promo.imageUrl && (
                                                <div className="mb-3">
                                                    <img
                                                        src={promo.imageUrl}
                                                        alt={promo.name}
                                                        className="w-full max-w-xs h-auto rounded-lg border shadow-sm"
                                                    />
                                                </div>
                                            )}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                                                <div className="bg-slate-50/50 p-3 rounded-lg border">
                                                    <p className="text-muted-foreground mb-1 text-xs sm:text-sm">Jam Mulai</p>
                                                    <p className="font-medium text-base sm:text-lg">{promo.startTime}</p>
                                                </div>
                                                <div className="bg-slate-50/50 p-3 rounded-lg border">
                                                    <p className="text-muted-foreground mb-1 text-xs sm:text-sm">Jam Akhir</p>
                                                    <p className="font-medium text-base sm:text-lg">{promo.endTime}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                                                    <p className="text-sm font-medium text-muted-foreground">
                                                        Buku yang Dipromo ({promo.books.length})
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {promo.books.map((book) => (
                                                        <div
                                                            key={book.id}
                                                            className="bg-linear-to-br from-white to-blue-50/50 p-3 sm:p-4 rounded-lg border border-blue-100 hover:border-blue-300 transition-all duration-300 group/book"
                                                        >
                                                            <p className="font-medium truncate text-sm group-hover/book:text-primary transition-colors">
                                                                {book.title}
                                                            </p>
                                                            <p className="text-muted-foreground text-xs truncate mt-1">
                                                                {book.author}
                                                            </p>
                                                            <div className="flex items-center justify-between mt-2">
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="bg-orange-100 text-orange-800 border-orange-200 text-xs"
                                                                >
                                                                    Diskon: {book.discount}%
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </Sidebar>
    );
}