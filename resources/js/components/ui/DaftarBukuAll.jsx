import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import BookSkeleton from "./BookSkeleton";

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

export default function DaftarBukuAll() {
    const [allBooks, setAllBooks] = useState([]);
    const [displayedBooks, setDisplayedBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [sortBy, setSortBy] = useState("promo");
    const [filterPromo, setFilterPromo] = useState("all");
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const res = await fetch("/api/books/recommended?unlimited=true");
                if (res.ok) {
                    const data = await res.json();
                    setAllBooks(data);
                    setDisplayedBooks(data.slice(0, itemsPerPage));
                    setHasMore(data.length > itemsPerPage);
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
        let result = [...allBooks];

        if (filterPromo === "promo") {
            result = result.filter(book => book.has_promo);
        } else if (filterPromo === "non_promo") {
            result = result.filter(book => !book.has_promo);
        }

        if (sortBy === "promo") {
            result.sort((a, b) => {
                if (a.has_promo && !b.has_promo) return -1;
                if (!a.has_promo && b.has_promo) return 1;
                return a.title.localeCompare(b.title, 'id');
            });
        } else if (sortBy === "title-asc") {
            result.sort((a, b) => a.title.localeCompare(b.title, 'id'));
        } else if (sortBy === "title-desc") {
            result.sort((a, b) => b.title.localeCompare(a.title, 'id'));
        } else if (sortBy === "price-asc") {
            result.sort((a, b) => (a.discountPrice || a.originalPrice) - (b.discountPrice || b.originalPrice));
        } else if (sortBy === "price-desc") {
            result.sort((a, b) => (b.discountPrice || b.originalPrice) - (a.discountPrice || a.originalPrice));
        }

        setDisplayedBooks(result.slice(0, itemsPerPage));
        setHasMore(result.length > itemsPerPage);
    }, [allBooks, sortBy, filterPromo]);

    const loadMore = () => {
        const next = displayedBooks.length + itemsPerPage;
        setDisplayedBooks(allBooks.slice(0, next));
        setHasMore(allBooks.length > next);
    };

    if (loading) {
        return (
            <div className="py-4 md:py-6 px-3 sm:px-4">
                <div className="max-w-6xl mx-auto">
                    <h1 className="select-none text-center text-lg sm:text-xl md:text-2xl mb-4 md:mb-6 text-gray-200" style={{ fontFamily: "Rubik Mono One" }}>
                        DAFTAR BUKU
                    </h1>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[...Array(10)].map((_, i) => (
                            <BookSkeleton key={i} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (displayedBooks.length === 0) {
        return (
            <div className="py-3 md:py-4 px-3 sm:px-4">
                <div className="max-w-6xl mx-auto">
                    <h1 className="mt-16 select-none text-center text-lg sm:text-xl md:text-2xl mb-4 md:mb-6 text-gray-200" style={{ fontFamily: "Rubik Mono One" }}>
                        DAFTAR BUKU
                    </h1>
                    <p className="text-center text-gray-500 text-sm">Tidak ada buku tersedia.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="py-3 md:py-4 px-3 sm:px-4 mb-10">
            <div className="max-w-6xl mx-auto">
                <h1
                    className="mt-16 select-none text-center text-lg sm:text-xl md:text-2xl mb-4 md:mb-6 text-gray-200"
                    style={{ fontFamily: "Rubik Mono One" }}
                >
                    DAFTAR BUKU
                </h1>

                <div className="flex flex-wrap gap-2 justify-center mb-6">
                    <select
                        value={filterPromo}
                        onChange={(e) => setFilterPromo(e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                    >
                        <option value="all">Semua Buku</option>
                        <option value="promo">Hanya Promo</option>
                        <option value="non_promo">Tanpa Promo</option>
                    </select>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                    >
                        <option value="promo">Diskon</option>
                        <option value="title-asc">Judul A–Z</option>
                        <option value="title-desc">Judul Z–A</option>
                        <option value="price-asc">Harga Termurah</option>
                        <option value="price-desc">Harga Termahal</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {displayedBooks.map((book) => {
                        const discountPercent = getDiscountPercent(book.originalPrice, book.discountPrice);
                        const categoryLabels = getCategoryLabels(book.category);

                        return (
                            <div key={book.id} className="group relative rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200 bg-white flex flex-col">
                                {book.promo_name && (
                                    <div className="absolute top-2 left-2 z-20">
                                        <div className="bg-linear-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">
                                            {book.promo_name}
                                        </div>
                                    </div>
                                )}

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
                                        onError={(e) => (e.target.src = "/placeholder.svg")}
                                    />
                                </div>

                                <div className="p-2 bg-white flex flex-col">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900 text-xs sm:text-sm line-clamp-2 mb-1">{book.title}</h3>
                                        <p className="text-xs text-gray-600 mb-1">by {book.author}</p>
                                    </div>

                                    {/* ✅ Kategori badge */}
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

                {hasMore && (
                    <div className="flex justify-center mt-8">
                        <button
                            onClick={loadMore}
                            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors text-sm font-medium"
                        >
                            Muat Lebih Banyak
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}