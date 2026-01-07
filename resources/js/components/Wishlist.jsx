import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import NavbarHome from "./ui/NavbarHome";
import { useAuth } from "@/hooks/useAuth";
import AnimatedWaves from "./ui/AnimatedWaves";
import Loading from "./ui/Loading";
import HeartAnimation from "./ui/AnimatedHeart";

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

const getDiscountPercent = (originalPrice, discountPrice) => {
    if (!originalPrice || !discountPrice || originalPrice <= discountPrice) return null;
    return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
};

const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(price);
};

export default function WishlistPage() {
    document.title = "Wishlist - Lobaca";
    const { token } = useAuth();
    const [wishlistBooks, setWishlistBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWishlist = async () => {
            if (!token) {
                setWishlistBooks([]);
                setLoading(false);
                return;
            }

            try {
                const res = await fetch("/api/wishlist", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json"
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    setWishlistBooks(data);
                } else {
                    setWishlistBooks([]);
                }
            } catch (err) {
                console.error("Gagal mengambil wishlist:", err);
                setWishlistBooks([]);
            } finally {
                setLoading(false);
            }
        };

        fetchWishlist();
    }, [token]);

    if (loading) {
        return (
            <>
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
                    <Loading />
                </div>
                <div className="absolute inset-0 z-0">
                    <AnimatedWaves />
                </div>
            </>
        );
    }

    if (wishlistBooks.length === 0) {
        return (
            <>
                <NavbarHome />
                <div className="relative py-12 px-4 sm:px-6 md:px-8 min-h-[calc(100vh-80px)] flex ">
                    <div className="absolute inset-0 z-0">
                        <AnimatedWaves />
                    </div>
                    <div className="relative z-10 max-w-2xl mx-auto text-center">
                        <HeartAnimation />
                        <div className="mt-5">
                            <h1 className="text-2xl font-bold text-gray-800 mb-3">Wishlist Kosong</h1>
                            <p className="text-gray-600 mb-6">
                                Belum ada buku yang kamu simpan. Temukan buku favoritmu dan tambahkan ke wishlist!
                            </p>
                            <Link
                                to="/buku"
                                className="inline-block px-6 py-3 bg-yellow-500 text-white rounded-full font-medium hover:bg-yellow-600 transition"
                            >
                                Jelajahi Buku
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }


    return (
        <>
            <NavbarHome />
            <div className="py-3 md:py-4 px-3 sm:px-4 mb-16">
                <div className="block">
                    <AnimatedWaves />
                </div>
                <div className="max-w-6xl mx-auto mt-16">
                    <h1
                        className="select-none text-center text-lg sm:text-xl md:text-2xl mb-4 md:mb-6 text-gray-800"
                        style={{ fontFamily: "Rubik Mono One" }}
                    >
                        WISHLIST
                    </h1>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {wishlistBooks.map((book) => {
                            const discountPercent = getDiscountPercent(book.originalPrice, book.discountPrice);
                            const categoryLabels = getCategoryLabels(book.category);

                            return (
                                <div
                                    key={book.id}
                                    className="group relative rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200 bg-white flex flex-col"
                                >
                                    {book.has_promo && (
                                        <div className="absolute top-2 left-2 z-20">
                                            <div className="bg-linear-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">
                                                {book.promo_name}
                                            </div>
                                        </div>
                                    )}
                                    <Link
                                        to={`/buku/${book.slug}`}
                                        state={{ id: book.id }}
                                        className="absolute inset-0 z-10"
                                        aria-label={`Lihat detail ${book.title}`}
                                    />
                                    <div className="w-full pt-[120%] relative overflow-hidden bg-gray-100">
                                        <img
                                            src={book.image || "/placeholder.svg"}
                                            alt={book.title}
                                            className="absolute top-0 left-0 w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 p-2"
                                            onError={(e) => (e.target.src = "/placeholder.svg")}
                                        />
                                    </div>
                                    <div className="p-2 bg-white flex flex-col">
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900 text-xs sm:text-sm line-clamp-2 mb-1">
                                                {book.title}
                                            </h3>
                                            <p className="text-xs text-gray-600 mb-1">by {book.author}</p>
                                        </div>

                                        {categoryLabels.length > 0 && (
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {categoryLabels.map((label, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full truncate"
                                                    >
                                                        {label}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between mt-1">
                                            <div className="flex flex-col">
                                                {book.originalPrice !== book.discountPrice ? (
                                                    <>
                                                        <span className="text-green-600 font-bold text-xs sm:text-sm">
                                                            {formatPrice(book.discountPrice)}
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[10px] text-gray-500 line-through">
                                                                {formatPrice(book.originalPrice)}
                                                            </span>
                                                            {discountPercent && (
                                                                <span className="text-[10px] px-1 rounded bg-red-100 text-red-600 font-bold">
                                                                    -{discountPercent}%
                                                                </span>
                                                            )}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="font-bold text-xs sm:text-sm">
                                                        {formatPrice(book.originalPrice)}
                                                    </span>
                                                )}
                                            </div>
                                            {book.rating > 0 ? (
                                                <div className="flex items-center text-xs text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded-full">
                                                    ★ {book.rating.toFixed(1)}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-gray-500 italic">
                                                    Belum di Review
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}