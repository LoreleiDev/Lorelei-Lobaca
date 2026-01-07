import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
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

export default function SearchResults() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q") || "";
    const categories = searchParams.getAll("category");

    const [allBooks, setAllBooks] = useState([]);
    const [filteredAndSortedBooks, setFilteredAndSortedBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [skeletonCount, setSkeletonCount] = useState(5);
    const [sortBy, setSortBy] = useState("title-asc");
    const [filterPromo, setFilterPromo] = useState("all");

    const lastRequestRef = useRef({ query: null, categories: null });

    useEffect(() => {
        const fetchSearchResults = async () => {
            const currentQuery = query.trim();
            const currentCategories = [...categories];

            const cacheKey = `${currentQuery}|${currentCategories.sort().join(',')}`;
            if (lastRequestRef.current.cacheKey === cacheKey) {
                return;
            }
            lastRequestRef.current.cacheKey = cacheKey;

            if (!currentQuery && currentCategories.length === 0) {
                setAllBooks([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            let finalBooks = [];

            try {
                if (currentQuery) {
                    const params = new URLSearchParams();
                    params.append('q', currentQuery);
                    currentCategories.forEach(cat => params.append('category', cat));
                    const res = await fetch(`/api/search/books?${params.toString()}`);
                    finalBooks = res.ok ? await res.json() : [];
                } else if (currentCategories.length > 0) {
                    const fetchPromises = currentCategories.map(cat => {
                        const p = new URLSearchParams();
                        p.append('category', cat);
                        return fetch(`/api/search/books?${p.toString()}`)
                            .then(r => (r.ok ? r.json() : []))
                            .catch(() => []);
                    });

                    const allResults = await Promise.all(fetchPromises);
                    const bookMap = new Map();
                    for (const books of allResults) {
                        for (const book of books) {
                            if (!bookMap.has(book.id)) {
                                bookMap.set(book.id, book);
                            }
                        }
                    }
                    finalBooks = Array.from(bookMap.values());
                }

                const latestCacheKey = `${searchParams.get("q") || ""}|${searchParams.getAll("category").sort().join(',')}`;
                if (latestCacheKey === cacheKey) {
                    setAllBooks(finalBooks);
                }
            } catch (error) {
                console.error("Gagal memuat hasil pencarian:", error);
                setAllBooks([]);
            } finally {
                const latestCacheKey = `${searchParams.get("q") || ""}|${searchParams.getAll("category").sort().join(',')}`;
                if (latestCacheKey === cacheKey) {
                    setLoading(false);
                }
            }
        };

        fetchSearchResults();
    }, [query, categories, searchParams]);

    useEffect(() => {
        const updateSkeletonCount = () => setSkeletonCount(getSkeletonCount());
        updateSkeletonCount();
        window.addEventListener("resize", updateSkeletonCount);
        return () => window.removeEventListener("resize", updateSkeletonCount);
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
                return a.title.localeCompare(b.title, "id");
            });
        } else if (sortBy === "title-asc") {
            result.sort((a, b) => a.title.localeCompare(b.title, "id"));
        } else if (sortBy === "title-desc") {
            result.sort((a, b) => b.title.localeCompare(a.title, "id"));
        } else if (sortBy === "price-asc") {
            result.sort((a, b) => (a.discountPrice || a.originalPrice) - (b.discountPrice || b.originalPrice));
        } else if (sortBy === "price-desc") {
            result.sort((a, b) => (b.discountPrice || b.originalPrice) - (a.discountPrice || a.originalPrice));
        }
        setFilteredAndSortedBooks(result);
    }, [allBooks, sortBy, filterPromo]);

    const displayLabel = () => {
        if (query) return `"${query}"`;

        if (categories.length > 0) {
            const labels = categories.map(cat => {
                const found = BOOK_CATEGORIES.find(c => c.value === cat);
                return found ? found.label : cat;
            });
            return labels.join(", ");
        }

        return "semua buku";
    };

    if (loading) {
        return (
            <div className="py-4 md:py-6 px-3 sm:px-4">
                <div className="max-w-6xl mx-auto">
                    <h1 className="select-none text-center text-lg sm:text-xl md:text-2xl mb-4 md:mb-6 text-gray-200" style={{ fontFamily: "Rubik Mono One" }}>
                        HASIL PENCARIAN
                    </h1>
                    <p className="text-center text-gray-200 mb-4">Mencari: {displayLabel()}</p>
                    <div className="flex overflow-x-hidden">
                        {[...Array(skeletonCount)].map((_, i) => (
                            <div
                                key={i}
                                className={`pl-1 md:pl-2 ${skeletonCount === 2 ? "basis-1/2" : skeletonCount === 3 ? "basis-1/3" : skeletonCount === 4 ? "basis-1/4" : "basis-1/5"}`}
                            >
                                <BookSkeleton />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (filteredAndSortedBooks.length === 0) {
        return (
            <div className="py-3 md:py-4 px-3 sm:px-4">
                <div className="max-w-6xl mx-auto">
                    <h1 className="mt-16 select-none text-center text-lg sm:text-xl md:text-2xl mb-4 md:mb-6 text-gray-200" style={{ fontFamily: "Rubik Mono One" }}>
                        HASIL PENCARIAN
                    </h1>
                    <p className="text-center text-gray-200 mb-2">Tidak ada buku untuk: {displayLabel()}</p>
                    <p className="text-center text-gray-200 text-sm mb-5">Coba kata kunci lain atau luaskan filter.</p>
                    <div className="flex flex-wrap gap-2 justify-center mb-4">
                        <select value={filterPromo} onChange={e => setFilterPromo(e.target.value)} className="text-xs border border-gray-300 rounded px-2 py-1 bg-white">
                            <option value="all">Semua Buku</option>
                            <option value="promo">Hanya Promo</option>
                            <option value="non_promo">Tanpa Promo</option>
                        </select>
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-xs border border-gray-300 rounded px-2 py-1 bg-white">
                            <option value="promo">Diskon</option>
                            <option value="title-asc">Judul A–Z</option>
                            <option value="title-desc">Judul Z–A</option>
                            <option value="price-asc">Harga Termurah</option>
                            <option value="price-desc">Harga Termahal</option>
                        </select>
                    </div>
                    <div className="flex justify-center mt-6">
                        <Link to="/" className="text-xs md:text-sm font-bold text-yellow-600 hover:text-yellow-200 transition-colors">
                            ← Kembali ke Beranda
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-3 md:py-4 px-3 sm:px-4">
            <div className="max-w-6xl mx-auto">
                <h1 className="mt-16 select-none text-center text-lg sm:text-xl md:text-2xl mb-2 md:mb-4 text-gray-200" style={{ fontFamily: "Rubik Mono One" }}>
                    HASIL PENCARIAN
                </h1>
                <p className="text-center text-gray-200 mb-4">Untuk: <strong>{displayLabel()}</strong></p>
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                    <select value={filterPromo} onChange={e => setFilterPromo(e.target.value)} className="text-xs border border-gray-300 rounded px-2 py-1 bg-white">
                        <option value="all">Semua Buku</option>
                        <option value="promo">Hanya Promo</option>
                        <option value="non_promo">Tanpa Promo</option>
                    </select>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-xs border border-gray-300 rounded px-2 py-1 bg-white">
                        <option value="promo">Diskon</option>
                        <option value="title-asc">Judul A–Z</option>
                        <option value="title-desc">Judul Z–A</option>
                        <option value="price-asc">Harga Termurah</option>
                        <option value="price-desc">Harga Termahal</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredAndSortedBooks.map(book => {
                        const categoryLabels = getCategoryLabels(book.category);
                        return (
                            <div
                                key={book.id}
                                className="group relative rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200 bg-white flex flex-col"
                            >
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
                                    className="absolute inset-0 z-10"
                                    aria-label={`Lihat detail ${book.title}`}
                                />
                                <div className="w-full pt-[120%] relative overflow-hidden bg-gray-100">
                                    <img
                                        src={book.image}
                                        alt={book.title}
                                        className="absolute top-0 left-0 w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 p-2"
                                        onError={e => (e.target.src = "/placeholder.svg")}
                                    />
                                </div>
                                <div className="p-2 bg-white flex flex-col">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900 text-xs sm:text-sm line-clamp-2 mb-1">{book.title}</h3>
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
                                                        {book.discountPercent && (
                                                            <span className="text-[10px] px-1 rounded bg-red-100 text-red-600 font-bold">
                                                                -{book.discountPercent}%
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
                    <Link to="/buku" className="text-xs md:text-sm font-bold text-yellow-600 hover:text-yellow-200 transition-colors">
                        Lihat Semua Buku →
                    </Link>
                </div>
            </div>
        </div>
    );
}