import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Trash2,
    Edit2,
    Eye,
    BookOpen,
    Filter,
    Search,
    Package,
    Tag,
    Users,
    Library,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Settings,
    X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Sidebar from "./ui/Sidebar";
import Swal from "sweetalert2";
import Loading from "../ui/Loading";

const TruncatedText = ({ text, maxLength = 150 }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    if (!text) return "Tidak ada deskripsi.";
    const shouldTruncate = text.length > maxLength;
    const displayText = isExpanded
        ? text
        : text.slice(0, maxLength) + (shouldTruncate ? "..." : "");
    return (
        <div>
            <p className="whitespace-pre-line text-xs leading-relaxed">
                {displayText}
            </p>
            {shouldTruncate && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-primary hover:text-primary/80 text-xs font-medium mt-1 focus:outline-none transition-colors"
                >
                    {isExpanded ? "Tampilkan lebih sedikit" : "Tampilkan lebih banyak"}
                </button>
            )}
        </div>
    );
};

const MobileBookCard = ({
    book,
    selectedIds,
    setSelectedIds,
    setSelectedBook,
    handleDelete,
    deletingId,
    mobileMenuOpen,
    setMobileMenuOpen,
    lowStockThreshold,
    highStockThreshold,
    categoryMap,
}) => {
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setMobileMenuOpen((prev) => ({
                    ...prev,
                    [book.buku_id]: false,
                }));
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [book.buku_id, setMobileMenuOpen]);

    const toggleMobileMenu = (bookId) => {
        setMobileMenuOpen((prev) => ({
            ...prev,
            [bookId]: !prev[bookId],
        }));
    };

    const getConditionColor = (kondisi) => {
        const conditions = {
            baru: "bg-green-100 text-green-800 border-green-200",
            baik: "bg-blue-100 text-blue-800 border-blue-200",
            cukup: "bg-yellow-100 text-yellow-800 border-yellow-200",
            rusak: "bg-red-100 text-red-800 border-red-200",
            minus: "bg-orange-100 text-orange-800 border-orange-200",
        };
        return conditions[kondisi] || "bg-gray-100 text-gray-800 border-gray-200";
    };

    const getStockColor = (stok) => {
        if (stok === 0) return "bg-red-100 text-red-800 border-red-200";
        if (stok <= lowStockThreshold) return "bg-orange-100 text-orange-800 border-orange-200";
        return "bg-green-100 text-green-800 border-green-200";
    };

    const renderKategori = (kategori, categoryMap) => {
        if (!kategori) {
            return <span className="text-muted-foreground">–</span>;
        }
        if (Array.isArray(kategori)) {
            if (kategori.length === 0) {
                return <span className="text-muted-foreground">–</span>;
            }
            return kategori.map((k, i) => {
                const label = categoryMap[k] || k;
                return (
                    <Badge
                        key={i}
                        variant="secondary"
                        className="bg-purple-100 text-purple-800 border-purple-200 text-xs mr-1 mb-1"
                    >
                        {label}
                    </Badge>
                );
            });
        }
        if (typeof kategori === 'string') {
            const categories = kategori.split(",").filter(k => k.trim());
            if (categories.length === 0) {
                return <span className="text-muted-foreground">–</span>;
            }
            return categories.map((k, i) => {
                const trimmed = k.trim();
                const label = categoryMap[trimmed] || trimmed;
                return (
                    <Badge
                        key={i}
                        variant="secondary"
                        className="bg-purple-100 text-purple-800 border-purple-200 text-xs mr-1 mb-1"
                    >
                        {label}
                    </Badge>
                );
            });
        }
        return <span className="text-muted-foreground">–</span>;
    };

    return (
        <Card className="mb-4 bg-white/80 backdrop-blur-sm shadow-lg border-0 relative">
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3 flex-1">
                        <input
                            type="checkbox"
                            checked={selectedIds.has(book.buku_id)}
                            onChange={(e) => {
                                const newSelected = new Set(selectedIds);
                                if (e.target.checked) {
                                    newSelected.add(book.buku_id);
                                } else {
                                    newSelected.delete(book.buku_id);
                                }
                                setSelectedIds(newSelected);
                            }}
                            className="rounded border-border text-primary focus:ring-primary cursor-pointer w-4 h-4 mt-1"
                        />
                        <img
                            src={book.foto || "/placeholder.svg"}
                            alt={book.judul}
                            width={50}
                            height={65}
                            className="rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate">
                                {book.judul}
                            </h3>
                            <p className="text-muted-foreground text-sm truncate">
                                {book.penulis}
                            </p>
                            <p className="text-muted-foreground text-xs truncate">
                                {book.penerbit}
                            </p>
                        </div>
                    </div>
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => toggleMobileMenu(book.buku_id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <MoreVertical size={16} />
                        </button>
                        {mobileMenuOpen[book.buku_id] && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-lg z-50 min-w-35">
                                <button
                                    onClick={() => {
                                        setSelectedBook(book);
                                        setMobileMenuOpen({});
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 flex items-center gap-3 border-b border-border"
                                >
                                    <Eye size={16} />
                                    Lihat Detail
                                </button>
                                <Link
                                    to={`/admin/inventory/${book.buku_id}`}
                                    onClick={() => setMobileMenuOpen({})}
                                >
                                    <div className="w-full text-left px-4 py-3 text-sm hover:bg-green-50 flex items-center gap-3 border-b border-border">
                                        <Edit2 size={16} />
                                        Edit Buku
                                    </div>
                                </Link>
                                <button
                                    onClick={() => {
                                        handleDelete(book.buku_id, book.foto);
                                        setMobileMenuOpen({});
                                    }}
                                    disabled={deletingId === book.buku_id}
                                    className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 flex items-center gap-3 text-red-600 disabled:opacity-50"
                                >
                                    <Trash2 size={16} />
                                    Hapus Buku
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Stok:</span>
                        <Badge
                            className={`${getStockColor(book.stok)} border px-2 py-1 rounded text-xs`}
                        >
                            {book.stok}
                        </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Kondisi:</span>
                        <Badge
                            className={`${getConditionColor(book.kondisi)} border px-2 py-1 rounded text-xs`}
                        >
                            {book.kondisi}
                        </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Harga:</span>
                        {book.promo_info ? (
                            <div className="text-right">
                                <div className="line-through text-muted-foreground text-xs">
                                    Rp {book.harga?.toLocaleString("id-ID")}
                                </div>
                                <div className="font-semibold text-primary text-sm">
                                    Rp{" "}
                                    {book.promo_info.harga_setelah_diskon?.toLocaleString("id-ID")}
                                    <span className="ml-1 text-xs bg-red-100 text-red-800 px-1 rounded">
                                        -{book.promo_info.diskon_persen}%
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <span className="font-semibold text-foreground text-sm">
                                Rp {book.harga?.toLocaleString("id-ID")}
                            </span>
                        )}
                    </div>
                    <div>
                        <span className="text-muted-foreground">Kategori:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                            {renderKategori(book.category, categoryMap)}
                        </div>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Deskripsi:</span>
                        <div className="mt-1">
                            <TruncatedText text={book.deskripsi} maxLength={100} />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage,
    onItemsPerPageChange,
}) => {
    const itemsPerPageOptions = [5, 10, 20, 50];

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, "...", totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-border">
            <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Tampilkan:</span>
                <select
                    value={itemsPerPage}
                    onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                    className="border border-border rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                >
                    {itemsPerPageOptions.map((option) => (
                        <option key={option} value={option}>
                            {option} per halaman
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Halaman pertama"
                >
                    <ChevronsLeft size={16} />
                </button>
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Halaman sebelumnya"
                >
                    <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => (
                        <button
                            key={index}
                            onClick={() => typeof page === "number" && onPageChange(page)}
                            disabled={page === "..."}
                            className={`min-w-8 h-8 px-2 rounded-md border transition-colors ${currentPage === page
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "border-border hover:bg-muted"
                                } ${page === "..." ? "cursor-default hover:bg-transparent" : ""}`}
                        >
                            {page}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-md border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Halaman berikutnya"
                >
                    <ChevronRight size={16} />
                </button>
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-md border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Halaman terakhir"
                >
                    <ChevronsRight size={16} />
                </button>
            </div>
            <div className="text-sm text-muted-foreground">
                Halaman {currentPage} dari {totalPages}
            </div>
        </div>
    );
};

export default function BookInventory({ books = [], onRefresh = () => { } }) {
    const [deletingId, setDeletingId] = useState(null);
    const [selectedBook, setSelectedBook] = useState(null);
    const [showDeleteLoading, setShowDeleteLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isMobile, setIsMobile] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState({});
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [lowStockThreshold, setLowStockThreshold] = useState(5);
    const [highStockThreshold, setHighStockThreshold] = useState(10);

    const [categories, setCategories] = useState([]);
    const [categoryMap, setCategoryMap] = useState({});

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/public/categories');
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data);
                    const map = {};
                    data.forEach(cat => {
                        if (cat.slug) map[cat.slug] = cat.label || cat.name;
                        if (cat.value) map[cat.value] = cat.label || cat.name;
                    });
                    setCategoryMap(map);
                }
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);
        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    useEffect(() => {
        if (selectedBook) {
            setMobileMenuOpen({});
        }
    }, [selectedBook]);

    useEffect(() => {
        const savedLow = localStorage.getItem("lowStockThreshold");
        const savedHigh = localStorage.getItem("highStockThreshold");
        if (savedLow) {
            const parsed = parseInt(savedLow);
            if (!isNaN(parsed) && parsed >= 1) {
                setLowStockThreshold(parsed);
            }
        }
        if (savedHigh) {
            const parsed = parseInt(savedHigh);
            if (!isNaN(parsed) && parsed >= 1) {
                setHighStockThreshold(parsed);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("lowStockThreshold", lowStockThreshold.toString());
        localStorage.setItem("highStockThreshold", highStockThreshold.toString());
    }, [lowStockThreshold, highStockThreshold]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const filteredBooks = useMemo(() => {
        return books.filter((book) => {
            const matchesSearch =
                book.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
                book.penulis.toLowerCase().includes(searchTerm.toLowerCase()) ||
                book.penerbit.toLowerCase().includes(searchTerm.toLowerCase());
            let matchesStatus = true;
            if (statusFilter === "high") {
                matchesStatus = book.stok >= highStockThreshold;
            } else if (statusFilter === "low") {
                matchesStatus = book.stok >= 1 && book.stok <= lowStockThreshold;
            } else if (statusFilter === "out") {
                matchesStatus = book.stok === 0;
            }
            return matchesSearch && matchesStatus;
        });
    }, [books, searchTerm, statusFilter, lowStockThreshold, highStockThreshold]);

    const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentBooks = filteredBooks.slice(startIndex, endIndex);

    const stats = {
        total: books.length,
        high: books.filter((b) => b.stok >= highStockThreshold).length,
        low: books.filter((b) => b.stok >= 1 && b.stok <= lowStockThreshold).length,
        outOfStock: books.filter((b) => b.stok === 0).length,
    };

    const handleDelete = async (id, fotoUrl) => {
        const result = await Swal.fire({
            title: "Apakah Anda yakin?",
            text: "Buku yang dihapus tidak dapat dikembalikan!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Ya, hapus!",
            cancelButtonText: "Batal",
            reverseButtons: true,
        });
        if (!result.isConfirmed) return;

        const token = localStorage.getItem("admin_token");
        if (!token) {
            Swal.fire("Error", "Sesi admin tidak valid. Silakan login ulang.", "error");
            return;
        }

        try {
            setDeletingId(id);
            setShowDeleteLoading(true);
            if (fotoUrl && fotoUrl.startsWith("https://res.cloudinary.com/")) {
                await fetch("/api/admin/books/cleanup-image", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ foto_url: fotoUrl }),
                });
            }
            const res = await fetch(`/api/admin/books/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });
            if (res.ok) {
                Swal.fire("Berhasil", "Buku berhasil dihapus.", "success");
                onRefresh();
                if (currentBooks.length === 1 && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                }
            } else {
                const err = await res.json().catch(() => ({}));
                Swal.fire("Error", err.message || "Gagal menghapus buku.", "error");
            }
        } catch (error) {
            console.error("Delete error:", error);
            Swal.fire("Error", "Terjadi kesalahan jaringan.", "error");
        } finally {
            setDeletingId(null);
            setShowDeleteLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        const result = await Swal.fire({
            title: "Hapus Buku Terpilih?",
            text: `Anda akan menghapus ${selectedIds.size} buku. Tindakan ini tidak bisa dibatalkan!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Ya, hapus!",
            cancelButtonText: "Batal",
            reverseButtons: true,
        });
        if (!result.isConfirmed) return;

        const token = localStorage.getItem("admin_token");
        if (!token) {
            Swal.fire("Error", "Sesi admin tidak valid.", "error");
            return;
        }

        try {
            setShowDeleteLoading(true);
            const booksToDelete = books.filter((book) =>
                selectedIds.has(book.buku_id)
            );
            const fotoUrls = booksToDelete
                .map((b) => b.foto)
                .filter((url) => url && url.startsWith("https://res.cloudinary.com/"));

            await Promise.all(
                fotoUrls.map((url) =>
                    fetch("/api/admin/books/cleanup-image", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ foto_url: url }),
                    })
                )
            );

            const response = await fetch("/api/admin/books/bulk", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                body: JSON.stringify({ ids: Array.from(selectedIds) }),
            });

            if (response.ok) {
                Swal.fire("Berhasil", "Buku berhasil dihapus.", "success");
                onRefresh();
                setSelectedIds(new Set());
                setCurrentPage(1);
            } else {
                const err = await response.json().catch(() => ({}));
                Swal.fire("Error", err.message || "Gagal menghapus buku.", "error");
            }
        } catch (error) {
            console.error("Bulk delete error:", error);
            Swal.fire("Error", "Terjadi kesalahan jaringan.", "error");
        } finally {
            setShowDeleteLoading(false);
        }
    };

    const getConditionColor = (kondisi) => {
        const conditions = {
            baru: "bg-green-100 text-green-800 border-green-200",
            baik: "bg-blue-100 text-blue-800 border-blue-200",
            cukup: "bg-yellow-100 text-yellow-800 border-yellow-200",
            rusak: "bg-red-100 text-red-800 border-red-200",
            minus: "bg-orange-100 text-orange-800 border-orange-200",
        };
        return conditions[kondisi] || "bg-gray-100 text-gray-800 border-gray-200";
    };

    const getStockColor = (stok) => {
        if (stok === 0) return "bg-red-100 text-red-800 border-red-200";
        if (stok <= lowStockThreshold) return "bg-orange-100 text-orange-800 border-orange-200";
        return "bg-green-100 text-green-800 border-green-200";
    };

    const renderKategori = (kategori, categoryMap) => {
        if (!kategori) {
            return <span className="text-muted-foreground">–</span>;
        }
        if (Array.isArray(kategori)) {
            if (kategori.length === 0) {
                return <span className="text-muted-foreground">–</span>;
            }
            return kategori.map((k, i) => {
                const label = categoryMap[k] || k;
                return (
                    <Badge
                        key={i}
                        variant="secondary"
                        className="bg-purple-100 text-purple-800 border-purple-200 text-xs mr-1 mb-1"
                    >
                        {label}
                    </Badge>
                );
            });
        }
        if (typeof kategori === 'string') {
            const categories = kategori.split(",").filter(k => k.trim());
            if (categories.length === 0) {
                return <span className="text-muted-foreground">–</span>;
            }
            return categories.map((k, i) => {
                const trimmed = k.trim();
                const label = categoryMap[trimmed] || trimmed;
                return (
                    <Badge
                        key={i}
                        variant="secondary"
                        className="bg-purple-100 text-purple-800 border-purple-200 text-xs mr-1 mb-1"
                    >
                        {label}
                    </Badge>
                );
            });
        }
        return <span className="text-muted-foreground">–</span>;
    };

    const handleSaveSettings = () => {
        const low = parseInt(lowStockThreshold);
        const high = parseInt(highStockThreshold);

        if (isNaN(low) || low < 1) {
            Swal.fire({
                icon: "error",
                title: "Konfigurasi Tidak Valid",
                text: "Batas stok rendah harus angka minimal 1",
                background: "#1e293b",
                color: "#f1f5f9",
            });
            return;
        }
        if (isNaN(high) || high < 1) {
            Swal.fire({
                icon: "error",
                title: "Konfigurasi Tidak Valid",
                text: "Batas stok tinggi harus angka minimal 1",
                background: "#1e293b",
                color: "#f1f5f9",
            });
            return;
        }

        localStorage.setItem("lowStockThreshold", low.toString());
        localStorage.setItem("highStockThreshold", high.toString());

        Swal.fire({
            icon: "success",
            title: "Pengaturan Disimpan",
            text: "Batas stok berhasil diperbarui",
            background: "#1e293b",
            color: "#f1f5f9",
            timer: 1500,
            showConfirmButton: false,
        });
        setIsSettingsOpen(false);
    };

    if (!Array.isArray(books)) {
        return (
            <Sidebar>
                <div className="p-6 text-center text-muted-foreground">
                    Data buku tidak valid atau belum dimuat.
                </div>
            </Sidebar>
        );
    }

    return (
        <Sidebar>
            {showDeleteLoading && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 bg-black/50">
                    <Loading />
                </div>
            )}
            <div className="min-h-screen bg-background p-4 sm:p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                                Manajemen Inventori
                            </h1>
                            <p className="text-muted-foreground text-sm sm:text-lg">
                                Kelola semua buku dalam inventori Anda
                            </p>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <Button
                                onClick={() => setIsSettingsOpen(true)}
                                variant="outline"
                                className="gap-2 cursor-pointer w-full md:w-auto"
                            >
                                <Settings className="w-4 h-4" />
                                <span className="hidden sm:inline">Pengaturan Stok</span>
                                <span className="sm:hidden">Stok</span>
                            </Button>
                            <Link to="/admin/upload" className="w-full md:w-auto">
                                <Button className="gap-2 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 bg-purple-600 border-0 w-full md:w-auto">
                                    <BookOpen className="w-4 h-4" />
                                    <span className="hidden sm:inline">Tambah Buku Baru</span>
                                    <span className="sm:hidden">Tambah Buku</span>
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 md:mb-8">
                        <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-blue-500 shadow-lg">
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">
                                            Total Buku
                                        </p>
                                        <p className="text-lg sm:text-xl font-bold">
                                            {stats.total}
                                        </p>
                                    </div>
                                    <div className="p-2 bg-blue-100 rounded-full">
                                        <Library className="w-4 h-4 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-green-500 shadow-lg">
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">
                                            Stok Tinggi (&gt;={highStockThreshold})
                                        </p>
                                        <p className="text-lg sm:text-xl font-bold">
                                            {stats.high}
                                        </p>
                                    </div>
                                    <div className="p-2 bg-green-100 rounded-full">
                                        <Package className="w-4 h-4 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-orange-500 shadow-lg">
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">
                                            Stok Rendah (1-{lowStockThreshold})
                                        </p>
                                        <p className="text-lg sm:text-xl font-bold">
                                            {stats.low}
                                        </p>
                                    </div>
                                    <div className="p-2 bg-orange-100 rounded-full">
                                        <Tag className="w-4 h-4 text-orange-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-red-500 shadow-lg">
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">
                                            Habis
                                        </p>
                                        <p className="text-lg sm:text-xl font-bold">
                                            {stats.outOfStock}
                                        </p>
                                    </div>
                                    <div className="p-2 bg-red-100 rounded-full">
                                        <Users className="w-4 h-4 text-red-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="bg-white/80 backdrop-blur-sm shadow-lg mb-4 md:mb-6">
                        <CardContent className="p-4 md:p-6">
                            <div className="flex flex-col gap-4">
                                <div className="w-full">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Cari buku berdasarkan judul, penulis, atau penerbit..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white/50 text-sm md:text-base"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <Filter className="w-4 h-4 text-muted-foreground" />
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white/50 w-full sm:w-auto"
                                        >
                                            <option value="all">Semua Status</option>
                                            <option value="high">Stok Tinggi (&gt;={highStockThreshold})</option>
                                            <option value="low">Stok Rendah (1-{lowStockThreshold})</option>
                                            <option value="out">Habis</option>
                                        </select>
                                    </div>
                                    {selectedIds.size > 0 && (
                                        <div className="flex items-center gap-3 bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20 w-full sm:w-auto justify-between">
                                            <span className="text-sm font-medium text-destructive">
                                                {selectedIds.size} dipilih
                                            </span>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="cursor-pointer h-8 text-xs"
                                                onClick={handleBulkDelete}
                                                disabled={showDeleteLoading}
                                            >
                                                Hapus Terpilih
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mb-4 flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                            Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredBooks.length)} dari {filteredBooks.length} buku
                        </div>
                    </div>

                    {isMobile ? (
                        <div className="space-y-4">
                            {currentBooks.length === 0 ? (
                                <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
                                    <CardContent className="p-8 text-center text-muted-foreground">
                                        Tidak ada buku yang ditemukan.
                                    </CardContent>
                                </Card>
                            ) : (
                                currentBooks.map((book) => (
                                    <MobileBookCard
                                        key={book.buku_id}
                                        book={book}
                                        selectedIds={selectedIds}
                                        setSelectedIds={setSelectedIds}
                                        setSelectedBook={setSelectedBook}
                                        handleDelete={handleDelete}
                                        deletingId={deletingId}
                                        mobileMenuOpen={mobileMenuOpen}
                                        setMobileMenuOpen={setMobileMenuOpen}
                                        lowStockThreshold={lowStockThreshold}
                                        highStockThreshold={highStockThreshold}
                                        categoryMap={categoryMap}
                                    />
                                ))
                            )}
                        </div>
                    ) : (
                        <>
                            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <div className="min-w-250">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-border bg-linear-to-r from-slate-50 to-blue-50/50">
                                                    <th className="px-4 md:px-6 py-3 md:py-4 text-center font-semibold text-foreground whitespace-nowrap w-12">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                selectedIds.size > 0 &&
                                                                selectedIds.size === currentBooks.length
                                                            }
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedIds(
                                                                        new Set(currentBooks.map((b) => b.buku_id))
                                                                    );
                                                                } else {
                                                                    setSelectedIds(new Set());
                                                                }
                                                            }}
                                                            className="rounded border-border text-primary focus:ring-primary cursor-pointer w-4 h-4"
                                                        />
                                                    </th>
                                                    <th className="px-4 md:px-6 py-3 md:py-4 text-left font-semibold text-foreground whitespace-nowrap">
                                                        Buku
                                                    </th>
                                                    <th className="px-4 md:px-6 py-3 md:py-4 text-left font-semibold text-foreground whitespace-nowrap">
                                                        Informasi
                                                    </th>
                                                    <th className="px-4 md:px-6 py-3 md:py-4 text-left font-semibold text-foreground whitespace-nowrap">
                                                        Stok & Kondisi
                                                    </th>
                                                    <th className="px-4 md:px-6 py-3 md:py-4 text-left font-semibold text-foreground whitespace-nowrap">
                                                        Kategori
                                                    </th>
                                                    <th className="px-4 md:px-6 py-3 md:py-4 text-left font-semibold text-foreground whitespace-nowrap">
                                                        Harga
                                                    </th>
                                                    <th className="px-4 md:px-6 py-3 md:py-4 text-center font-semibold text-foreground whitespace-nowrap">
                                                        Aksi
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentBooks.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="7" className="px-6 py-8 text-center text-muted-foreground">
                                                            Tidak ada buku yang ditemukan.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    currentBooks.map((book) => (
                                                        <tr
                                                            key={book.buku_id}
                                                            className="border-b border-border hover:bg-muted/50"
                                                        >
                                                            <td className="px-4 md:px-6 py-3 md:py-4 text-center whitespace-nowrap">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedIds.has(book.buku_id)}
                                                                    onChange={(e) => {
                                                                        const newSelected = new Set(selectedIds);
                                                                        if (e.target.checked) {
                                                                            newSelected.add(book.buku_id);
                                                                        } else {
                                                                            newSelected.delete(book.buku_id);
                                                                        }
                                                                        setSelectedIds(newSelected);
                                                                    }}
                                                                    className="rounded border-border text-primary focus:ring-primary cursor-pointer w-4 h-4"
                                                                />
                                                            </td>
                                                            <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                                                <div className="flex items-center gap-3">
                                                                    <img
                                                                        src={book.foto}
                                                                        alt={book.judul}
                                                                        width={60}
                                                                        height={80}
                                                                        className="rounded object-cover"
                                                                    />
                                                                    <div className="min-w-0">
                                                                        <p className="font-medium text-foreground truncate">
                                                                            {book.judul}
                                                                        </p>
                                                                        <p className="text-muted-foreground text-sm truncate">
                                                                            {book.penulis}
                                                                        </p>
                                                                        <p className="text-muted-foreground text-xs truncate">
                                                                            {book.penerbit}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 md:px-6 py-3 md:py-4">
                                                                <div className="space-y-1">
                                                                    <p className="text-sm text-muted-foreground">
                                                                        ISBN: {book.isbn || "–"}
                                                                    </p>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        Tahun: {book.tahun}
                                                                    </p>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        Deskripsi:
                                                                    </p>
                                                                    <div className="max-w-xs">
                                                                        <TruncatedText text={book.deskripsi} maxLength={75} />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                                                <div className="space-y-2">
                                                                    <Badge
                                                                        className={`${getStockColor(book.stok)} border px-2 py-1 rounded`}
                                                                    >
                                                                        Stok: {book.stok}
                                                                    </Badge>
                                                                    <Badge
                                                                        className={`${getConditionColor(book.kondisi)} border px-2 py-1 rounded`}
                                                                    >
                                                                        {book.kondisi}
                                                                    </Badge>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 md:px-6 py-3 md:py-4">
                                                                {renderKategori(book.category, categoryMap)}
                                                            </td>
                                                            <td className="px-4 md:px-6 py-3 md:py-4">
                                                                {book.promo_info ? (
                                                                    <div className="flex flex-col">
                                                                        <span className="line-through text-muted-foreground text-sm">
                                                                            Rp {book.harga?.toLocaleString("id-ID")}
                                                                        </span>
                                                                        <span className="font-semibold text-primary">
                                                                            Rp{" "}
                                                                            {book.promo_info.harga_setelah_diskon?.toLocaleString("id-ID")}
                                                                            <span className="ml-1 text-xs bg-red-100 text-red-800 px-1 rounded">
                                                                                -{book.promo_info.diskon_persen}%
                                                                            </span>
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="font-semibold text-foreground">
                                                                        Rp {book.harga?.toLocaleString("id-ID")}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <button
                                                                        onClick={() => setSelectedBook(book)}
                                                                        className="cursor-pointer rounded-lg p-2 hover:bg-blue-100 text-blue-600 transition-all duration-200 hover:scale-110"
                                                                        title="Lihat detail"
                                                                    >
                                                                        <Eye size={16} />
                                                                    </button>
                                                                    <Link to={`/admin/inventory/${book.buku_id}`}>
                                                                        <button
                                                                            className="cursor-pointer rounded-lg p-2 hover:bg-green-100 text-green-600 transition-all duration-200 hover:scale-110"
                                                                            title="Edit buku"
                                                                        >
                                                                            <Edit2 size={16} />
                                                                        </button>
                                                                    </Link>
                                                                    <button
                                                                        onClick={() => handleDelete(book.buku_id, book.foto)}
                                                                        disabled={deletingId === book.buku_id}
                                                                        className="cursor-pointer rounded-lg p-2 hover:bg-red-100 text-red-600 transition-all duration-200 hover:scale-110 disabled:opacity-50"
                                                                        title="Hapus buku"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </Card>
                            {filteredBooks.length > 0 && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                    itemsPerPage={itemsPerPage}
                                    onItemsPerPageChange={(value) => {
                                        setItemsPerPage(value);
                                        setCurrentPage(1);
                                    }}
                                />
                            )}
                        </>
                    )}

                    {isMobile && filteredBooks.length > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            itemsPerPage={itemsPerPage}
                            onItemsPerPageChange={(value) => {
                                setItemsPerPage(value);
                                setCurrentPage(1);
                            }}
                        />
                    )}
                </div>
            </div>

            {selectedBook && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 backdrop-blur-sm"
                    onClick={() => setSelectedBook(null)}
                >
                    <div
                        className="w-full max-w-4xl rounded-xl bg-white shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden border-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="md:w-2/5 p-4 sm:p-6 md:p-8 flex flex-col bg-linear-to-b from-slate-50 to-blue-50/30">
                            <div className="flex-1 flex items-center justify-center">
                                {selectedBook.foto ? (
                                    <img
                                        src={selectedBook.foto}
                                        alt={selectedBook.judul}
                                        className="w-full h-auto max-h-60 sm:max-h-80 md:max-h-full object-contain rounded-lg"
                                    />
                                ) : (
                                    <div className="w-full h-48 sm:h-64 bg-muted rounded-lg flex items-center justify-center">
                                        <span className="text-muted-foreground">No Image</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="md:w-3/5 p-4 sm:p-6 md:p-8 border-t md:border-t-0 md:border-l border-border overflow-y-auto">
                            <div className="space-y-4 sm:space-y-6">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-foreground line-clamp-2">
                                        {selectedBook.judul}
                                    </h2>
                                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                                        {selectedBook.penulis}
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <p className="font-semibold text-xs sm:text-sm text-muted-foreground">
                                            Penerbit
                                        </p>
                                        <p className="text-foreground text-sm sm:text-base">
                                            {selectedBook.penerbit}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-xs sm:text-sm text-muted-foreground">
                                            ISBN
                                        </p>
                                        <p className="text-foreground text-sm sm:text-base">
                                            {selectedBook.isbn || "–"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-xs sm:text-sm text-muted-foreground">
                                            Tahun
                                        </p>
                                        <p className="text-foreground text-sm sm:text-base">
                                            {selectedBook.tahun}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-xs sm:text-sm text-muted-foreground">
                                            Stok
                                        </p>
                                        <p className="text-foreground text-sm sm:text-base">
                                            <Badge
                                                className={`${getStockColor(selectedBook.stok)} border px-2 py-1 rounded text-xs`}
                                            >
                                                {selectedBook.stok}
                                            </Badge>
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-xs sm:text-sm text-muted-foreground">
                                            Kondisi
                                        </p>
                                        <p className="text-foreground text-sm sm:text-base">
                                            <Badge
                                                className={`${getConditionColor(selectedBook.kondisi)} border px-2 py-1 rounded text-xs`}
                                            >
                                                {selectedBook.kondisi}
                                            </Badge>
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-xs sm:text-sm text-muted-foreground">
                                            Berat
                                        </p>
                                        <p className="text-foreground text-sm sm:text-base">
                                            {selectedBook.berat ? `${selectedBook.berat} gram` : "–"}
                                        </p>
                                    </div>
                                    <div className="col-span-1 sm:col-span-2">
                                        <p className="font-semibold text-xs sm:text-sm text-muted-foreground">
                                            Harga
                                        </p>
                                        {selectedBook.promo_info ? (
                                            <div className="flex flex-col">
                                                <p className="text-muted-foreground line-through text-sm sm:text-base">
                                                    Rp {selectedBook.harga?.toLocaleString("id-ID")}
                                                </p>
                                                <p className="text-foreground font-bold text-base sm:text-lg">
                                                    Rp{" "}
                                                    {selectedBook.promo_info.harga_setelah_diskon?.toLocaleString("id-ID")}
                                                    <span className="ml-2 text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full">
                                                        -{selectedBook.promo_info.diskon_persen}%
                                                    </span>
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-foreground font-bold text-base sm:text-lg">
                                                Rp {selectedBook.harga?.toLocaleString("id-ID")}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="font-semibold text-xs sm:text-sm text-muted-foreground mb-2">
                                        Deskripsi
                                    </p>
                                    <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
                                        {selectedBook.deskripsi ? (
                                            <TruncatedText text={selectedBook.deskripsi} maxLength={200} />
                                        ) : (
                                            <p className="text-muted-foreground text-sm">Tidak ada deskripsi.</p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="font-semibold text-xs sm:text-sm text-muted-foreground mb-2">
                                        Kategori
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {renderKategori(selectedBook.category, categoryMap)}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 sm:mt-6 flex gap-2 sm:gap-3 pt-4 border-t border-border">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedBook(null)}
                                    className="flex-1 cursor-pointer text-sm sm:text-base"
                                >
                                    Tutup
                                </Button>
                                <Link to={`/admin/inventory/${selectedBook.buku_id}`} className="flex-1">
                                    <Button className="w-full cursor-pointer text-sm sm:text-base">
                                        Edit Buku
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            <span>Pengaturan Batas Stok</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="low-stock" className="text-sm font-medium">
                                Batas Stok Rendah
                            </Label>
                            <Input
                                id="low-stock"
                                type="number"
                                value={lowStockThreshold}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === "") {
                                        setLowStockThreshold("");
                                    } else {
                                        const num = parseInt(value);
                                        if (!isNaN(num) && num >= 1) {
                                            setLowStockThreshold(num);
                                        }
                                    }
                                }}
                                min="1"
                                className="mt-2"
                                placeholder="Min: 1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Buku dengan stok 1-{lowStockThreshold || '?'} akan ditandai sebagai stok rendah
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="high-stock" className="text-sm font-medium">
                                Batas Stok Tinggi
                            </Label>
                            <Input
                                id="high-stock"
                                type="number"
                                value={highStockThreshold}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === "") {
                                        setHighStockThreshold("");
                                    } else {
                                        const num = parseInt(value);
                                        if (!isNaN(num) && num >= 1) {
                                            setHighStockThreshold(num);
                                        }
                                    }
                                }}
                                min="1"
                                className="mt-2"
                                placeholder="Min: 1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Buku dengan stok ≥ {highStockThreshold || '?'} akan ditandai sebagai stok tinggi
                            </p>
                        </div>
                        <div className="flex gap-2 justify-end pt-4 border-t border-border">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setLowStockThreshold(5);
                                    setHighStockThreshold(10);
                                }}
                                className="cursor-pointer"
                            >
                                Reset Default
                            </Button>
                            <Button onClick={handleSaveSettings} className="cursor-pointer">
                                Simpan Pengaturan
                            </Button>
                        </div>
                        <div className="bg-muted/30 p-3 rounded-lg">
                            <p className="text-sm font-medium mb-2">Keterangan:</p>
                            <ul className="text-xs space-y-1 text-muted-foreground">
                                <li>• Stok Rendah: 1-{lowStockThreshold || '?'} item</li>
                                <li>• Stok Tinggi: ≥ {highStockThreshold || '?'} item</li>
                                <li>• Habis: 0 item</li>
                                <li>• Kedua batas dapat diatur secara independen</li>
                                <li>• Pengaturan ini disimpan di browser Anda</li>
                            </ul>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Sidebar>
    );
}