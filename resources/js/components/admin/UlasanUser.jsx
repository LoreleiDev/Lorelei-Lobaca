import { useState, useEffect } from "react";
import Sidebar from "./ui/Sidebar";
import { Button } from "@/components/ui/button";
import { Star, ChevronLeft, ChevronRight, MessageSquare, BookOpen } from "lucide-react";
import Swal from "sweetalert2";

const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    }
});

export default function AdminUlasanPage() {
    const [books, setBooks] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingBooks, setLoadingBooks] = useState(false);

    const adminToken = localStorage.getItem('admin_token');

    const fetchBooks = async () => {
        setLoadingBooks(true);
        try {
            const res = await fetch("/api/admin/ulasan/books", {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setBooks(data.books);
            } else {
                Toast.fire({ icon: "error", title: "Gagal memuat daftar buku." });
            }
        } catch (error) {
            Toast.fire({ icon: "error", title: "Kesalahan jaringan." });
        } finally {
            setLoadingBooks(false);
        }
    };

    const fetchReviews = async (bookId) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/ulasan/book/${bookId}`, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setReviews(data.reviews);
                setSelectedBook(data.book);
            } else {
                Toast.fire({ icon: "error", title: "Gagal memuat ulasan." });
            }
        } catch (error) {
            Toast.fire({ icon: "error", title: "Kesalahan jaringan." });
        } finally {
            setLoading(false);
        }
    };

    const handleMakeTestimonial = async (reviewId) => {
        try {
            const res = await fetch(`/api/admin/ulasan/${reviewId}/to-testimonial`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                }
            });
            if (res.ok) {
                Toast.fire({ icon: "success", title: "Ulasan berhasil dijadikan testimonial." });

                if (selectedBook) {
                    fetchReviews(selectedBook.id);
                }
            } else {
                const data = await res.json();
                Toast.fire({ icon: "error", title: data.message || "Gagal menjadikan testimonial." });
            }
        } catch (error) {
            Toast.fire({ icon: "error", title: "Kesalahan jaringan." });
        }
    };

    const handleRemoveTestimonial = async (reviewId) => {
        try {
            const res = await fetch(`/api/admin/ulasan/${reviewId}/remove-testimonial`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });
            if (res.ok) {
                Toast.fire({ icon: "success", title: "Status testimonial berhasil dihapus." });

                if (selectedBook) {
                    fetchReviews(selectedBook.id);
                }
            } else {
                const data = await res.json();
                Toast.fire({ icon: "error", title: data.message || "Gagal menghapus testimonial." });
            }
        } catch (error) {
            Toast.fire({ icon: "error", title: "Kesalahan jaringan." });
        }
    };

    useEffect(() => {
        fetchBooks();
    }, []);

    return (
        <Sidebar>
            <div className="min-h-screen bg-gray-50 p-4 md:p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Kelola Ulasan</h1>
                        <p className="text-gray-600 mt-1">Atur dan pilih ulasan untuk ditampilkan sebagai testimonial</p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Daftar Buku */}
                        <div className="w-full lg:w-1/3">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <BookOpen className="text-gray-600" size={18} />
                                    <h2 className="text-lg font-semibold text-gray-800">Daftar Buku</h2>
                                </div>
                                
                                {loadingBooks ? (
                                    <div className="flex justify-center items-center h-32">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                                        {books.length > 0 ? (
                                            books.map((book) => (
                                                <div
                                                    key={book.buku_id}
                                                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                                        selectedBook && selectedBook.id === book.buku_id
                                                            ? "bg-blue-50 border-blue-300"
                                                            : "bg-white border-gray-200 hover:bg-gray-50"
                                                    }`}
                                                    onClick={() => fetchReviews(book.buku_id)}
                                                >
                                                    <div className="font-medium text-gray-800 truncate">{book.judul}</div>
                                                    <div className="text-sm text-gray-500">Ulasan: {book.reviews_count}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-center py-4">Tidak ada buku dengan ulasan.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Daftar Ulasan */}
                        <div className="w-full lg:w-2/3">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                {selectedBook ? (
                                    <>
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                                            <div>
                                                <h2 className="text-lg font-semibold text-gray-800">
                                                    Ulasan untuk: <span className="font-bold">{selectedBook.title}</span>
                                                </h2>
                                            </div>
                                            <button
                                                onClick={() => setSelectedBook(null)}
                                                className="mt-2 sm:mt-0 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                                            >
                                                <ChevronLeft size={16} /> Kembali
                                            </button>
                                        </div>

                                        {loading ? (
                                            <div className="flex justify-center items-center h-32">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                                {reviews.length > 0 ? (
                                                    reviews.map((rev) => (
                                                        <div key={rev.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                                            <div className="flex items-start gap-4">
                                                                {/* Avatar */}
                                                                <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center border border-gray-300">
                                                                    {rev.user?.avatar ? (
                                                                        <img
                                                                            src={rev.user.avatar}
                                                                            alt={rev.user.first_name || rev.user.last_name || "User"}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <span className="text-gray-600 text-lg">👤</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1">
                                                                    {/* Nama */}
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="font-semibold text-gray-800">
                                                                            {(rev.user?.first_name || rev.user?.last_name) ? `${rev.user.first_name || ''} ${rev.user.last_name || ''}`.trim() : "Anonim"}
                                                                        </span>
                                                                        {rev.is_already_testimonial && (
                                                                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">Testimonial</span>
                                                                        )}
                                                                    </div>
                                                                    {/* Rating */}
                                                                    <div className="flex mb-2">
                                                                        {[...Array(5)].map((_, i) => (
                                                                            <Star
                                                                                key={i}
                                                                                fill={i < rev.rating ? "#f59e0b" : "none"}
                                                                                stroke="#f59e0b"
                                                                                size={16}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                    {/* Komentar */}
                                                                    <p className="text-gray-700 text-sm">
                                                                        {rev.comment}
                                                                    </p>
                                                                    {/* Tanggal */}
                                                                    <p className="text-gray-400 text-xs mt-2">
                                                                        {new Date(rev.created_at).toLocaleDateString('id-ID')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="mt-3 flex justify-end">
                                                                {rev.is_already_testimonial ? (
                                                                    <Button
                                                                        onClick={() => handleRemoveTestimonial(rev.id)}
                                                                        className="cursor-pointer bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1.5 rounded-md"
                                                                    >
                                                                        Hapus Testimonial
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        onClick={() => handleMakeTestimonial(rev.id)}
                                                                        className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-md"
                                                                    >
                                                                        Jadikan Testimonial
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-gray-500 text-center py-4">Belum ada ulasan untuk buku ini.</p>
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-16">
                                        <MessageSquare className="mx-auto text-gray-400" size={48} />
                                        <p className="text-gray-500 mt-4">Pilih buku dari daftar untuk melihat ulasannya.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Sidebar>
    );
}