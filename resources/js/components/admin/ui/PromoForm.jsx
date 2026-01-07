import { useState, useEffect } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Card } from "../../ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../../ui/dialog";
import { BookSelector } from "./BookSelector";
import { X, ImageIcon, Trash2, Calendar, Clock, Plus, BookOpen } from "lucide-react";
import Swal from "sweetalert2";
import Loading from "@/components/ui/Loading";

export function PromoForm({
    initialPromo,
    onSave,
    onImageUpload,
}) {
    const [name, setName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [selectedBooks, setSelectedBooks] = useState([]);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const showErrorToast = (message) => {
        Swal.fire({
            toast: true,
            position: "top-end",
            icon: "error",
            title: message,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: "#1e293b",
            color: "#f1f5f9",
            iconColor: "#ef4444",
        });
    };

    useEffect(() => {
        if (initialPromo) {
            setName(initialPromo.name);
            setStartDate(initialPromo.startDate);
            setEndDate(initialPromo.endDate);
            setStartTime(initialPromo.startTime);
            setEndTime(initialPromo.endTime);
            setSelectedBooks(
                initialPromo.books.map((b) => ({ ...b, id: String(b.id) }))
            );
            setPreviewUrl(initialPromo.imageUrl || "");
        } else {
            setName("");
            setStartDate("");
            setEndDate("");
            setStartTime("");
            setEndTime("");
            setSelectedBooks([]);
            setPreviewUrl("");
            setImageFile(null);
        }
    }, [initialPromo]);

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            showErrorToast("Ukuran gambar maksimal 2 MB");
            return;
        }

        const validTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!validTypes.includes(file.type)) {
            showErrorToast("Format gambar harus JPG, PNG, atau WebP");
            return;
        }

        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        e.target.value = "";
    };

    const handleRemoveImage = () => {
        if (imageFile) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl("");
        setImageFile(null);
    };

    const handleAddBook = (books) => {
        const existingIds = new Set(selectedBooks.map(b => b.id));
        const newBooks = books.filter(book => !existingIds.has(book.id));
        if (newBooks.length > 0) {
            setSelectedBooks(prev => [...prev, ...newBooks]);
        } else {
            showErrorToast("Semua buku yang dipilih sudah ada dalam promo");
        }
        setIsSelectorOpen(false);
    };

    const handleRemoveBook = (index) => {
        setSelectedBooks(selectedBooks.filter((_, i) => i !== index));
    };

    const handleDiscountChange = (index, discount) => {
        const updated = [...selectedBooks];
        updated[index] = { ...updated[index], discount: parseInt(discount) || 0 };
        setSelectedBooks(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name || !startDate || !endDate || !startTime || !endTime || !previewUrl) {
            showErrorToast("Nama, tanggal, waktu, dan gambar wajib diisi");
            return;
        }

        const startDateTime = new Date(`${startDate}T${startTime}`);
        const endDateTime = new Date(`${endDate}T${endTime}`);
        if (endDateTime <= startDateTime) {
            showErrorToast("Waktu akhir harus setelah waktu mulai");
            return;
        }

        if (selectedBooks.length > 0) {
            const invalidBook = selectedBooks.find(book => !book.discount || book.discount < 1 || book.discount > 100);
            if (invalidBook) {
                showErrorToast("Diskon harus antara 1–100% untuk semua buku");
                return;
            }
        }

        setIsLoading(true);
        try {
            let finalImageUrl = initialPromo?.imageUrl || null;
            if (imageFile) {
                const uploadedUrl = await onImageUpload(imageFile);
                if (!uploadedUrl) {
                    setIsLoading(false);
                    return;
                }
                finalImageUrl = uploadedUrl;
            }

            await onSave({
                name,
                startDate,
                endDate,
                startTime,
                endTime,
                image_url: finalImageUrl,
                books: selectedBooks,
            });
        } catch (error) {
            console.error("Error saving promo:", error);
            showErrorToast("Terjadi kesalahan saat menyimpan promo");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {isLoading && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
                    <Loading />
                </div>
            )}

            <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
                <div className="mb-6">
                    <p className="text-gray-600 mt-2">
                        {initialPromo
                            ? "Perbarui informasi promo dan buku yang termasuk dalam penawaran"
                            : "Buat promo baru untuk menawarkan diskon pada buku-buku pilihan"
                        }
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Informasi Dasar Promo */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            Informasi Dasar Promo
                        </h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="promo-name" className="text-sm font-medium text-gray-700">
                                    Nama Promo *
                                </Label>
                                <Input
                                    id="promo-name"
                                    placeholder="Contoh: Promo Lebaran 2024, Flash Sale Akhir Tahun"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full"
                                />
                            </div>

                            {/* Gambar Promo */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" />
                                    Gambar Promo
                                </Label>
                                <div className="flex flex-col lg:flex-row gap-6 items-start">
                                    <div className="flex-1">
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-all duration-200 cursor-pointer bg-gray-50 hover:bg-blue-50">
                                            <Input
                                                id="promo-image"
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                onChange={handleImageChange}
                                                className="hidden"
                                            />
                                            <Label htmlFor="promo-image" className="cursor-pointer block">
                                                <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                                <p className="text-sm font-medium text-gray-700">
                                                    Klik untuk upload gambar promo
                                                </p>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Format: JPG, PNG, WebP | Maksimal: 2 MB
                                                </p>
                                            </Label>
                                        </div>
                                    </div>
                                    {previewUrl && (
                                        <div className="relative w-40 h-40 shrink-0 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                                            <img
                                                src={previewUrl}
                                                alt="Preview promo"
                                                className="w-full h-full object-cover"
                                            />
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="destructive"
                                                className="absolute top-1 right-1 h-6 w-6 p-0 cursor-pointer shadow-md"
                                                onClick={handleRemoveImage}
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Periode Promo */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Periode Promo
                        </h2>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start-date" className="text-sm font-medium text-gray-700">
                                        Tanggal Mulai *
                                    </Label>
                                    <Input
                                        id="start-date"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="start-time" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Jam Mulai *
                                    </Label>
                                    <Input
                                        id="start-time"
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="end-date" className="text-sm font-medium text-gray-700">
                                        Tanggal Akhir *
                                    </Label>
                                    <Input
                                        id="end-date"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end-time" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Jam Akhir *
                                    </Label>
                                    <Input
                                        id="end-time"
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Buku Promo */}
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <BookOpen className="w-5 h-5" />
                                Buku yang Dipromo
                            </h2>
                            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                {selectedBooks.length} buku terpilih
                            </span>
                        </div>

                        {selectedBooks.length === 0 ? (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-50 hover:border-gray-400 transition-colors">
                                <div className="max-w-sm mx-auto">
                                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 font-medium mb-2">
                                        Belum ada buku yang dipilih
                                    </p>
                                    <p className="text-gray-500 text-sm mb-4">
                                        Tambahkan buku untuk menampilkan daftar buku yang termasuk dalam promo ini
                                    </p>
                                    <Button
                                        type="button"
                                        onClick={() => setIsSelectorOpen(true)}
                                        className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Pilih Buku
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="max-h-96 overflow-y-auto space-y-3 p-2">
                                    {selectedBooks.map((book, index) => (
                                        <Card key={book.id} className="p-4 hover:shadow-md transition-all duration-200 border border-gray-200">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 truncate">{book.title}</p>
                                                    <p className="text-sm text-gray-600 truncate mt-1">{book.author}</p>
                                                    <div className="flex items-center gap-3 mt-3">
                                                        <Label className="text-sm font-medium text-gray-700">Diskon:</Label>
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                max="100"
                                                                value={book.discount}
                                                                onChange={(e) => handleDiscountChange(index, e.target.value)}
                                                                className="w-20 h-9 text-sm border-gray-300 focus:border-blue-500"
                                                            />
                                                            <span className="text-sm font-medium text-gray-700">%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 shrink-0">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveBook(index)}
                                                        className="h-9 w-9 p-0 text-red-600 hover:bg-red-50 cursor-pointer rounded-lg"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>

                                <div className="flex justify-center pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsSelectorOpen(true)}
                                        className="border-blue-600 text-blue-600 hover:bg-blue-50 cursor-pointer"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Tambah Buku Lain
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                        <Button
                            type="submit"
                            className="px-8 min-w-24 bg-blue-600 hover:bg-blue-700 cursor-pointer shadow-sm hover:shadow-md transition-all duration-200"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    {initialPromo ? "Memperbarui..." : "Membuat..."}
                                </div>
                            ) : (
                                initialPromo ? "Perbarui Promo" : "Buat Promo"
                            )}
                        </Button>
                    </div>
                </form>

                {/* Book Selector Dialog */}
                <Dialog open={isSelectorOpen} onOpenChange={setIsSelectorOpen}>
                    <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">
                                Pilih Buku untuk Promo
                            </DialogTitle>
                            <DialogDescription className="text-base">
                                Pilih buku dari inventory yang akan termasuk dalam promo ini.
                                Anda dapat memilih multiple buku sekaligus.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 min-h-0 mt-4">
                            <BookSelector
                                onSelectBooks={handleAddBook}
                                onClose={() => setIsSelectorOpen(false)}
                                selectedBookIds={selectedBooks.map((b) => b.id)}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}