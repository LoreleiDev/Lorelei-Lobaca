import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import BookSkeleton, { getSkeletonCount } from "./BookSkeleton";


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

export default function DaftarBuku() {
    const [recommendedBooks, setRecommendedBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [skeletonCount, setSkeletonCount] = useState(5);

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const res = await fetch("/api/books/recommended?type=non_promo&limit=15");
                if (res.ok) {
                    const data = await res.json();
                    setRecommendedBooks(data);
                }
            } catch (error) {
                console.error("Gagal memuat buku rekomendasi:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBooks();
    }, []);

    useEffect(() => {
        const updateSkeletonCount = () => setSkeletonCount(getSkeletonCount());
        updateSkeletonCount();
        window.addEventListener('resize', updateSkeletonCount);
        return () => window.removeEventListener('resize', updateSkeletonCount);
    }, []);

    if (loading) {
        return (
            <div className="py-4 md:py-6 px-3 sm:px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[...Array(skeletonCount)].map((_, i) => (
                            <div key={i}>
                                <BookSkeleton />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (recommendedBooks.length === 0) {
        return null;
    }

    return (
        <div className="py-3 md:py-4 px-3 sm:px-4">
            <div className="max-w-6xl mx-auto">
                <h1
                    className="mt-16 select-none text-center text-lg sm:text-xl md:text-2xl mb-4 md:mb-6 text-gray-200"
                    style={{ fontFamily: "Rubik Mono One" }}
                >
                    REKOMENDASI
                </h1>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {recommendedBooks.map((book) => {
                        const discountPercent = getDiscountPercent(book.originalPrice, book.discountPrice);
                        const categoryLabels = getCategoryLabels(book.category);

                        return (
                            <div
                                key={book.id}
                                className="group relative rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200 bg-white flex flex-col"
                            >
                                <Link
                                    to={`/buku/${book.slug}`}
                                    state={{ id: book.id }}
                                    className="absolute inset-0 z-10" aria-label={`Lihat detail ${book.title}`}
                                />

                                <div className="w-full pt-[120%] relative overflow-hidden bg-gray-100">
                                    <img
                                        src={book.image || "/placeholder.svg"}
                                        alt={book.title}
                                        className="absolute top-0 left-0 w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 p-2"
                                        onError={(e) => {
                                            e.target.src = "/placeholder.svg";
                                        }}
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
                                                        Rp {book.discountPrice.toLocaleString("id-ID")}
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] text-gray-500 line-through">
                                                            Rp {book.originalPrice.toLocaleString("id-ID")}
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
                                                    Rp {book.originalPrice.toLocaleString("id-ID")}
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

                <div className="flex justify-center mt-6">
                    <Link
                        to="/buku"
                        className="text-xs md:text-sm font-bold text-white hover:text-gray-300 transition-colors"
                    >
                        Lihat Selengkapnya →
                    </Link>
                </div>
            </div>
        </div>
    );
}