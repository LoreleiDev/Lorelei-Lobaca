import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, Star } from "lucide-react";
import NavbarHome from "@/components/ui/NavbarHome";
import Loading from "@/components/ui/Loading";
import AnimatedWaves from "@/components/ui/AnimatedWaves";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
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

const BOOK_CATEGORIES = [
    { value: "fiksi", label: "Fiksi" },
    { value: "non_fiksi", label: "Non-Fiksi" },
    { value: "seni_kreatif", label: "Seni & Kreatif" },
    { value: "gaya_hidup", label: "Gaya Hidup" },
    { value: "pendidikan", label: "Pendidikan" },
    { value: "buku_anak", label: "Buku Anak" },
    { value: "komik", label: "Komik" },
    { value: "novel", label: "Novel" },
    { value: "majalah", label: "Majalah" },
];

const getCategoryLabels = (categoryString) => {
    if (!categoryString) return [];
    return categoryString
        .split(',')
        .map(cat => cat.trim())
        .filter(Boolean)
        .map(cat => {
            const found = BOOK_CATEGORIES.find(c => c.value === cat);
            return found ? found.label : cat;
        });
};

const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(price);
};

export default function BukuDetail() {
    document.title = "Buku - Lobaca";
    const navigate = useNavigate();
    const { isLoggedIn, requireLogin, isLoading: authLoading } = useAuth();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const [book, setBook] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showFullDesc, setShowFullDesc] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const location = useLocation();
    const bookId = location.state?.id;

    const bookIdRef = useRef(bookId);
    useEffect(() => {
        bookIdRef.current = bookId;
    }, [bookId]);

    useEffect(() => {
        const fetchBook = async () => {
            if (!bookId) {
                setIsLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/book/${bookId}`);
                if (res.ok) {
                    const data = await res.json();
                    setBook(data);
                    document.title = `${data.title} - Lobaca`;
                    fetchReviews();
                } else {
                    setBook(null);
                }
            } catch (error) {
                setBook(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBook();
    }, [bookId]);

    const fetchReviews = async () => {
        if (!bookId) return;

        setLoadingReviews(true);
        try {
            const token = localStorage.getItem('user_token');
            const res = await fetch(`/api/books/${bookId}/reviews`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setReviews(data.reviews);
            } else {
                setReviews([]);
            }
        } catch (error) {
            setReviews([]);
        } finally {
            setLoadingReviews(false);
        }
    };

    const goBack = () => {
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            navigate('/buku');
        }
    };

    const toggleDescription = () => {
        setShowFullDesc(!showFullDesc);
    };

    const categoryLabels = book ? getCategoryLabels(book.kategori) : [];

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!isLoggedIn) {
            await requireLogin("memberikan ulasan");
            return;
        }

        if (!comment.trim() || rating === 0) {
            Toast.fire({ icon: "warning", title: "Rating dan komentar wajib diisi!" });
            return;
        }

        try {
            const token = localStorage.getItem('user_token');
            const userReview = reviews.find(r => r.is_user_review);
            const method = userReview ? 'PUT' : 'POST';
            const url = userReview ? `/api/reviews/${userReview.id}` : '/api/reviews';
            const bodyData = userReview
                ? { rating, comment }
                : { book_id: bookId, rating, comment };

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bodyData)
            });

            if (res.ok) {
                Toast.fire({ icon: "success", title: userReview ? "Ulasan berhasil diubah!" : "Ulasan berhasil dikirim!" });
                setComment("");
                setRating(0);
                fetchReviews();
            } else {
                const data = await res.json();
                Toast.fire({ icon: "error", title: data.message || (userReview ? "Gagal mengubah ulasan." : "Gagal mengirim ulasan.") });
            }
        } catch (error) {
            Toast.fire({ icon: "error", title: "Kesalahan jaringan." });
        }
    };

    const handleAddToCart = async (e) => {
        e.preventDefault();

        if (!isLoggedIn) {
            await requireLogin("menambahkan ke keranjang");
            return;
        }


        const token = localStorage.getItem('user_token');

        try {
            const res = await fetch('/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    buku_id: bookId,
                    jumlah: 1
                })
            });

            if (res.ok) {
                const data = await res.json();
                Toast.fire({ icon: "success", title: "Buku berhasil ditambahkan ke keranjang!" });
            } else {
                const errorData = await res.json();
                Toast.fire({ icon: "error", title: errorData.message || "Gagal menambahkan ke keranjang." });
            }
        } catch (error) {
            Toast.fire({ icon: "error", title: "Kesalahan jaringan." });
        }
    };

    const handleAddToWishlist = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (authLoading) return;

        const currentId = bookIdRef.current;
        if (!currentId) return;

        if (!isLoggedIn) {
            const confirmed = await requireLogin("menambahkan ke wishlist");
            if (!confirmed) return;
        }

        const wasInWishlist = isInWishlist(currentId);
        await toggleWishlist(currentId);

        if (wasInWishlist) {
            Toast.fire({
                icon: "info",
                title: "Buku dihapus dari wishlist"
            });
        } else {
            Toast.fire({
                icon: "success",
                title: "Buku ditambahkan ke wishlist"
            });
        }
    }, [authLoading, isLoggedIn, isInWishlist, toggleWishlist, requireLogin]);

    const isInteractingDisabled = authLoading || isLoading;


    const userReview = reviews.length > 0 ? reviews.find(r => r.is_user_review) : null;
    const otherReviews = reviews.filter(r => !r.is_user_review);

    if (authLoading || isLoading) {
        return (
            <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
                <Loading />
            </div>
        );
    }

    if (!book) {
        return (
            <div className="min-h-screen bg-gray-50">
                <NavbarHome />
                <div className="py-16 px-4 sm:px-6 md:px-8">
                    <div className="max-w-2xl mx-auto text-center">
                        <h1 className="text-2xl font-bold text-gray-800 mb-4">Buku Tidak Ditemukan</h1>
                        <p className="text-gray-600 mb-6">Maaf, buku yang Anda cari tidak tersedia.</p>
                        <Link to="/buku" className="inline-block px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition">
                            Kembali ke Semua Buku
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const inWishlist = bookId ? isInWishlist(bookId) : false;

    return (
        <div className="min-h-screen relative">
            <div className="lg:block hidden">
                <AnimatedWaves />
            </div>

            <div className="relative z-10">
                <NavbarHome />

                {book && (
                    <>
                        <div className="py-6 px-4 sm:px-6 md:px-8">
                            <div className="max-w-5xl mx-auto">
                                <div className="mb-6">
                                    <button
                                        onClick={goBack}
                                        className="cursor-pointer flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                        ← Kembali
                                    </button>
                                </div>

                                <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
                                    <div className="lg:w-2/5 flex justify-center">
                                        <div className="p-4 w-full max-w-md">
                                            <img
                                                src={book.image || "/placeholder.svg"}
                                                alt={book.title}
                                                className="w-full bg-white rounded-2xl shadow-sm h-auto object-contain max-h-[400px]"
                                                onError={(e) => (e.target.src = "/placeholder.svg")}
                                            />
                                        </div>
                                    </div>

                                    <div className="lg:w-3/5">
                                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                                            {book.title}
                                        </h1>
                                        <p className="text-base text-gray-600 mb-5">
                                            by <span className="font-medium">{book.author}</span>
                                        </p>

                                        <div className="mb-6">
                                            {book.originalPrice !== book.discountPrice ? (
                                                <div className="flex items-end flex-wrap gap-2">
                                                    <span className="text-2xl md:text-3xl font-bold text-yellow-600">
                                                        {formatPrice(book.discountPrice)}
                                                    </span>
                                                    <span className="text-base text-gray-500 line-through">
                                                        {formatPrice(book.originalPrice)}
                                                    </span>
                                                    <span className="text-sm px-1 py-0.5 bg-red-100 text-red-700 rounded font-medium">
                                                        -{Math.round((1 - book.discountPrice / book.originalPrice) * 100)}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="text-2xl md:text-3xl font-bold text-gray-900">
                                                    {formatPrice(book.originalPrice)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mb-4">
                                            <div className="flex items-center">
                                                <span className="text-sm font-medium text-gray-700 mr-2">Stok:</span>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${book.stok > 0
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {book.stok || 0}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                                            {[
                                                { label: 'Penerbit', value: book.penerbit || "—" },
                                                { label: 'Tahun', value: book.tahun || "—" },
                                                { label: 'ISBN', value: book.isbn || "—" },
                                                { label: 'Berat', value: book.berat ? `${book.berat}g` : "—" },
                                                {
                                                    label: 'Kondisi',
                                                    value: (
                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${book.kondisi === 'baru'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {book.kondisi || "—"}
                                                        </span>
                                                    )
                                                }
                                            ].map((item, i) => (
                                                <div key={i} className="flex justify-between">
                                                    <span className="text-gray-600">{item.label}</span>
                                                    <span className="font-medium text-gray-900 max-w-[60%] text-right truncate">{item.value}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mb-6">
                                            <h2 className="text-base font-semibold text-black mb-2">Deskripsi</h2>
                                            <div className={`text-black text-sm leading-relaxed ${showFullDesc ? '' : 'line-clamp-4'}`}>
                                                {book.deskripsi || "Tidak ada deskripsi tersedia."}
                                            </div>
                                            {(book.deskripsi?.length > 200) && (
                                                <button
                                                    onClick={toggleDescription}
                                                    className="mt-2 text-blue-600 hover:text-blue-800 text-xs font-medium cursor-pointer"
                                                >
                                                    {showFullDesc ? 'Sembunyikan' : 'Tampilkan selengkapnya'}
                                                </button>
                                            )}
                                        </div>

                                        <div className="mb-6">
                                            <h2 className="text-base font-semibold text-gray-800 mb-2">Kategori</h2>
                                            {categoryLabels.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {categoryLabels.map((label, i) => (
                                                        <span
                                                            key={i}
                                                            className="text-[12px] px-3 py-1.5 bg-blue-100 text-blue-700 rounded-sm truncate"
                                                        >
                                                            {label}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="hidden md:flex gap-3">
                                            <Button
                                                onClick={handleAddToCart}
                                                disabled={isInteractingDisabled}
                                                className={`flex-1 py-3 gap-2 font-medium text-sm ${isInteractingDisabled
                                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-80"
                                                    : "bg-yellow-600 text-white hover:bg-yellow-700 cursor-pointer"
                                                    }`}
                                            >
                                                <ShoppingCart size={18} />
                                                Tambah ke Keranjang
                                            </Button>
                                            <Button
                                                onClick={handleAddToWishlist}
                                                disabled={isInteractingDisabled}
                                                className={`flex-1 gap-2 py-3 font-medium text-sm rounded-md ${isInteractingDisabled
                                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-80"
                                                    : inWishlist
                                                        ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                                                        : "bg-white text-blue-700 border border-blue-300 hover:bg-gray-100 cursor-pointer"
                                                    }`}
                                            >
                                                <Heart size={18} fill={inWishlist ? "white" : "none"} />
                                                {inWishlist ? "Dalam Wishlist" : "Wishlist"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Ulasan & Rating</h2>
                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                        {isLoggedIn ? (
                                            userReview ? (
                                                <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200 shadow-sm">
                                                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">Edit</span>
                                                        Ulasan Anda
                                                    </h3>
                                                    <form onSubmit={handleReviewSubmit}>
                                                        <div className="mb-3">
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                                                            <div className="flex space-x-1">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <button
                                                                        key={star}
                                                                        type="button"
                                                                        onClick={() => setRating(rating === star ? 0 : star)}
                                                                        className={`text-2xl ${isInteractingDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                                                                        disabled={isInteractingDisabled}
                                                                        aria-label={`Beri rating ${star} bintang`}
                                                                    >
                                                                        <Star
                                                                            fill={star <= rating ? "#f59e0b" : "none"}
                                                                            stroke="#f59e0b"
                                                                            size={24}
                                                                        />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="mb-3">
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Komentar</label>
                                                            <textarea
                                                                value={comment}
                                                                onChange={(e) => setComment(e.target.value)}
                                                                disabled={isInteractingDisabled}
                                                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${isInteractingDisabled
                                                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                                                                    : "border-gray-300 focus:ring-blue-500 bg-white"
                                                                    }`}
                                                                rows="3"
                                                                placeholder="Edit ulasan Anda..."
                                                            />
                                                        </div>
                                                        <Button
                                                            type="submit"
                                                            disabled={!comment.trim() || isInteractingDisabled}
                                                            className={`cursor-pointer px-6 py-2 rounded-lg font-medium ${!comment.trim() || isInteractingDisabled
                                                                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-80"
                                                                : "bg-blue-600 text-white hover:bg-blue-700"
                                                                }`}
                                                        >
                                                            Edit Ulasan
                                                        </Button>
                                                    </form>
                                                </div>
                                            ) : (
                                                <div className="mb-6">
                                                    <h3 className="font-medium text-gray-800 mb-3">Berikan Ulasan Anda</h3>
                                                    <form onSubmit={handleReviewSubmit}>
                                                        <div className="mb-3">
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                                                            <div className="flex space-x-1">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <button
                                                                        key={star}
                                                                        type="button"
                                                                        onClick={() => setRating(rating === star ? 0 : star)}
                                                                        className={`text-2xl ${isInteractingDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                                                                        disabled={isInteractingDisabled}
                                                                        aria-label={`Beri rating ${star} bintang`}
                                                                    >
                                                                        <Star
                                                                            fill={star <= rating ? "#f59e0b" : "none"}
                                                                            stroke="#f59e0b"
                                                                            size={24}
                                                                        />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="mb-3">
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Komentar</label>
                                                            <textarea
                                                                value={comment}
                                                                onChange={(e) => setComment(e.target.value)}
                                                                disabled={isInteractingDisabled}
                                                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${isInteractingDisabled
                                                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                                                                    : "border-gray-300 focus:ring-yellow-500 bg-white"
                                                                    }`}
                                                                rows="3"
                                                                placeholder="Tulis ulasan Anda..."
                                                            />
                                                        </div>
                                                        <Button
                                                            type="submit"
                                                            disabled={!comment.trim() || isInteractingDisabled}
                                                            className={`cursor-pointer px-6 py-2 rounded-lg font-medium ${!comment.trim() || isInteractingDisabled
                                                                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-80"
                                                                : "bg-yellow-600 text-white hover:bg-yellow-700"
                                                                }`}
                                                        >
                                                            Kirim Ulasan
                                                        </Button>
                                                    </form>
                                                </div>
                                            )
                                        ) : (
                                            <h3 className="font-medium text-gray-800 mb-3">Login untuk memberikan ulasan</h3>
                                        )}
                                    </div>
                                    <div className="mt-6 mb-5">
                                        <h3 className="font-medium text-gray-800 mb-3 text-lg ">Ulasan Pengguna</h3>
                                        {loadingReviews ? (
                                            <div className="text-gray-600 text-sm">Memuat ulasan...</div>
                                        ) : (
                                            <div className="space-y-4">
                                                {userReview && (
                                                    <div key={userReview.id} className="bg-white border border-green-300 rounded-xl p-4 shadow-sm ring-2 ring-green-100">
                                                        <div className="flex items-start gap-4">
                                                            {/* Avatar */}
                                                            <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
                                                                {userReview.user?.avatar ? (
                                                                    <img
                                                                        src={userReview.user.avatar}
                                                                        alt={userReview.user.first_name || userReview.user.last_name || "User"}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <span className="text-gray-500 text-lg">👤</span>
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                {/* Nama dengan tag "Anda" */}
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-semibold text-gray-900">
                                                                        {(userReview.user?.first_name || userReview.user?.last_name) ? `${userReview.user.first_name || ''} ${userReview.user.last_name || ''}`.trim() : "Anonim"}
                                                                    </span>
                                                                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">Anda</span>
                                                                </div>
                                                                {/* Rating */}
                                                                <div className="flex mb-2">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <Star
                                                                            key={i}
                                                                            fill={i < userReview.rating ? "#f59e0b" : "none"}
                                                                            stroke="#f59e0b"
                                                                            size={16}
                                                                        />
                                                                    ))}
                                                                </div>
                                                                {/* Komentar */}
                                                                <p className="text-gray-700 mt-2">{userReview.comment}</p>
                                                                {/* Tanggal */}
                                                                <p className="text-gray-400 text-xs mt-2">
                                                                    {new Date(userReview.created_at).toLocaleDateString('id-ID')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Render ulasan lainnya */}
                                                {otherReviews.length > 0 ? (
                                                    otherReviews.map((rev) => (
                                                        <div key={rev.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                                            <div className="flex items-start gap-4">
                                                                {/* Avatar */}
                                                                <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
                                                                    {rev.user?.avatar ? (
                                                                        <img
                                                                            src={rev.user.avatar}
                                                                            alt={rev.user.first_name || rev.user.last_name || "User"}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <span className="text-gray-500 text-lg">👤</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1">
                                                                    {/* Nama */}
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="font-semibold text-gray-900">
                                                                            {(rev.user?.first_name || rev.user?.last_name) ? `${rev.user.first_name || ''} ${rev.user.last_name || ''}`.trim() : "Anonim"}
                                                                        </span>
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
                                                                    <p className="text-gray-700 mt-2">{rev.comment}</p>
                                                                    {/* Tanggal */}
                                                                    <p className="text-gray-400 text-xs mt-2">
                                                                        {new Date(rev.created_at).toLocaleDateString('id-ID')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    !userReview && (
                                                        <div className="text-gray-600 text-sm">Belum ada ulasan.</div>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-lg z-50">
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleAddToWishlist}
                                    disabled={isInteractingDisabled}
                                    className={`cursor-pointer flex-1 gap-1 py-3 text-sm font-medium rounded-xl ${isInteractingDisabled
                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-80"
                                        : inWishlist
                                            ? "bg-blue-600 text-white hover:bg-blue-700"
                                            : "bg-white text-blue-700 border border-blue-300 hover:bg-gray-100"
                                        }`}
                                >
                                    <Heart size={18} fill={inWishlist ? "white" : "none"} />
                                    {inWishlist ? "Dalam Wishlist" : "Wishlist"}
                                </Button>
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={isInteractingDisabled}
                                    className={`cursor-pointer flex-1 gap-1 py-3 text-sm font-medium rounded-xl shadow-md ${isInteractingDisabled
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-80"
                                        : "bg-yellow-600 text-white hover:bg-yellow-700"
                                        }`}
                                >
                                    <ShoppingCart size={18} />
                                    Tambah ke Keranjang
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}