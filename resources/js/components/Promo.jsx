import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import Swal from "sweetalert2";
import NavbarHome from "@/components/ui/NavbarHome";
import Loading from "@/components/ui/Loading";
import { Calendar, Tag } from "lucide-react";

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
        .split(",")
        .map((cat) => cat.trim())
        .filter(Boolean)
        .map((cat) => {
            const found = BOOK_CATEGORIES.find((c) => c.value === cat);
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

const fetchBooksByIds = async (bookIds) => {
    if (bookIds.length === 0) return {};

    const params = new URLSearchParams(bookIds.map((id) => ["ids[]", id])).toString();
    const url = `/api/books?${params}`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            return {};
        }
        const books = await res.json();
        return books.reduce((map, book) => {
            map[book.id] = book;
            return map;
        }, {});
    } catch (error) {
        return {};
    }
};

export default function PromoListPage() {
    document.title = "Promo - Lobaca";
    const navigate = useNavigate();
    const { isLoggedIn, requireLogin } = useAuth();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingPromo, setProcessingPromo] = useState(null);

    useEffect(() => {
        const fetchPromos = async () => {
            try {
                const res = await fetch("/api/promos/active");
                if (res.ok) {
                    const promos = await res.json();
                    const promosWithBooks = promos.filter(
                        (promo) => promo.books && Array.isArray(promo.books) && promo.books.length > 0
                    );

                    if (promosWithBooks.length === 0) {
                        setPromos([]);
                        setLoading(false);
                        return;
                    }

                    const allBookIds = [
                        ...new Set(
                            promosWithBooks.flatMap((promo) => promo.books.map((b) => b.id)).filter(Boolean)
                        ),
                    ];

                    const bookDetailsMap = await fetchBooksByIds(allBookIds);

                    const promosWithFullBooks = promosWithBooks.map((promo) => {
                        const fullBooks = promo.books.map((book) => ({
                            ...book,
                            ...bookDetailsMap[book.id],
                        }));
                        return { ...promo, books: fullBooks };
                    });
                    setPromos(promosWithFullBooks);
                }
            } catch (err) {
            } finally {
                setLoading(false);
            }
        };
        fetchPromos();
    }, []);

    const handlePromoClick = (promo) => {
        const link = promo.books && promo.books.length > 0 ? `/promo/${promo.id}` : `/promo`;
        navigate(link);
    };

    const toggleAllWishlist = async (promoId, books) => {
        if (processingPromo) return;
        if (!isLoggedIn) {
            const proceed = await requireLogin("mengelola wishlist");
            if (!proceed) return;
        }

        setProcessingPromo(promoId);

        const visibleBooks = books || [];
        const allInWishlist = visibleBooks.every(book => isInWishlist(book.id));
        let added = 0;
        let removed = 0;

        if (allInWishlist) {
            for (const book of visibleBooks) {
                await toggleWishlist(book.id);
                removed++;
            }
        } else {
            const booksToAdd = visibleBooks.filter(book => !isInWishlist(book.id));
            for (const book of booksToAdd) {
                await toggleWishlist(book.id);
                added++;
            }
        }

        if (allInWishlist) {
            Toast.fire({
                icon: "info",
                title: `${removed} buku dihapus dari wishlist`
            });
        } else if (added > 0) {
            Toast.fire({
                icon: "success",
                title: `${added} buku ditambahkan ke wishlist`
            });
        } else {
            Toast.fire({
                icon: "info",
                title: "Tidak ada perubahan"
            });
        }

        setProcessingPromo(null);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
                <Loading />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-b from-blue-50/30 to-white">
            <NavbarHome />

            <div className="pt-20 pb-6 px-4 bg-linear-to-r from-blue-600 to-yellow-500">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <Tag className="w-4 h-4 text-white" />
                        </div>
                        <h1 className="text-2xl md:text-3xl text-white" style={{ fontFamily: "Rubik Mono One" }}>
                            PROMO SPESIAL
                        </h1>
                    </div>
                    <p className="text-blue-100 text-sm max-w-2xl">
                        Nikmati penawaran terbaik untuk koleksi buku pilihan Anda
                    </p>
                </div>
            </div>

            <div className="py-6 md:py-8 px-4">
                <div className="max-w-6xl mx-auto">
                    {promos.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-4">🎁</div>
                            <h2 className="text-xl font-bold text-gray-800 mb-3">Tidak Ada Promo Aktif</h2>
                            <p className="text-gray-600 mb-6">Cek kembali nanti untuk penawaran menarik!</p>
                            <Link
                                to="/buku"
                                className="inline-block px-6 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-full font-medium hover:bg-linear-to-r hover:from-blue-700 hover:to-blue-800 transition"
                            >
                                Jelajahi Buku
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {promos.map((promo) => {
                                const visibleBooks = promo.books?.slice(0, 5) || [];
                                const allInWishlist = visibleBooks.every((book) => isInWishlist(book.id));

                                const buttonText = allInWishlist ? "Hapus dari Wishlist" : "Tambahkan ke Wishlist";
                                const isDisabled = processingPromo === promo.id;

                                return (
                                    <div key={promo.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                                        <h2 className="text-xl font-bold text-black mb-2">{promo.name}</h2>

                                        <div className="relative mb-4 rounded-lg overflow-hidden">
                                            <div
                                                className="relative w-full rounded-lg overflow-hidden"
                                                style={{
                                                    aspectRatio: '2030 / 350',
                                                    maxHeight: '30vh',
                                                }}
                                            >
                                                <img
                                                    src={promo.imageUrl}
                                                    alt={promo.name}
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => (e.target.style.display = "none")}
                                                />
                                                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-linear-to-t from-black/80 via-transparent to-transparent"></div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                            <div className="flex items-center gap-2 text-gray-600 text-xs">
                                                <Calendar className="w-4 h-4" />
                                                <span>
                                                    {promo.startDate
                                                        ? `${new Date(promo.startDate).toLocaleDateString("id-ID")} – ${new Date(promo.endDate).toLocaleDateString("id-ID")}`
                                                        : "Berlaku selamanya"}
                                                </span>
                                            </div>

                                            <div className="flex gap-2">
                                                {/* Tombol Wishlist */}
                                                <div className="relative w-fit">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleAllWishlist(promo.id, promo.books);
                                                        }}
                                                        disabled={isDisabled}
                                                        className={`cursor-pointer relative ${isDisabled ? "opacity-70 cursor-not-allowed" : ""}`}
                                                        aria-label={buttonText}
                                                    >
                                                        <div
                                                            className={`relative z-10 px-3 py-2 ${isDisabled ? "grayscale" : ""}
                                                                bg-black rounded-md hover:bg-gray-800 border-2 text-white font-bold text-xs uppercase tracking-wide overflow-hidden`}
                                                        >
                                                            <span className="relative z-10">{buttonText}</span>
                                                            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,#000_1px,transparent_1px)] bg-size-[8px_8px] pointer-events-none"></div>
                                                            <div className="absolute inset-0 pointer-events-none">
                                                                <div className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-30 -top-1 -right-1 blur-[2px]"></div>
                                                                <div className="absolute w-2 h-2 bg-white rounded-full opacity-20 top-1/4 -left-1 blur-[2px]"></div>
                                                                <div className="absolute w-1 h-1 bg-white rounded-full opacity-40 bottom-1 right-2 blur-[2px]"></div>
                                                            </div>
                                                            <div className="absolute top-0 left-0 w-full h-1/2 bg-linear-to-b from-white/30 to-transparent pointer-events-none"></div>
                                                        </div>
                                                        <div className="absolute inset-0 rounded-full border-2 border-black z-0 pointer-events-none"></div>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {promo.books && promo.books.length > 0 ? (
                                            <>
                                                <h3 className="font-semibold text-gray-900 mb-4 text-lg">Buku dalam Promo</h3>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                                    {visibleBooks.map((book) => {
                                                        const categoryLabels = getCategoryLabels(book.category);
                                                        const discountPercent = getDiscountPercent(book.originalPrice, book.discountPrice);

                                                        return (
                                                            <div
                                                                key={book.id}
                                                                className="group relative rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200 bg-white flex flex-col"
                                                            >
                                                                <Link
                                                                    to={`/buku/${book.slug}`}
                                                                    state={{ id: book.id }}
                                                                    className="absolute inset-0 z-10"
                                                                    aria-label={`Lihat detail ${book.title}`}
                                                                />
                                                                <div className="w-full pt-[120%] relative overflow-hidden bg-gray-100">
                                                                    {book.image ? (
                                                                        <img
                                                                            src={book.image}
                                                                            alt={book.title}
                                                                            className="absolute top-0 left-0 w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 p-2"
                                                                            onError={(e) => {
                                                                                e.target.src = "/placeholder.svg";
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-50 to-yellow-50">
                                                                            <span className="text-gray-400 text-sm">No Image</span>
                                                                        </div>
                                                                    )}
                                                                    {discountPercent && (
                                                                        <div className="absolute top-2 right-2 z-20">
                                                                            <div className="px-2 py-1 bg-linear-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full">
                                                                                -{discountPercent}%
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="p-3 bg-white flex flex-col flex-1">
                                                                    <div className="flex-1 mb-2">
                                                                        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                                                                            {book.title}
                                                                        </h3>
                                                                        <p className="text-xs text-gray-600 mb-2">by {book.author}</p>
                                                                    </div>
                                                                    {categoryLabels.length > 0 && (
                                                                        <div className="mb-3">
                                                                            <div className="flex flex-wrap gap-1">
                                                                                {categoryLabels.map((label, i) => (
                                                                                    <span
                                                                                        key={i}
                                                                                        className="text-[10px] px-2 py-1 bg-linear-to-r from-blue-50 to-blue-100 text-blue-700 rounded-full border border-blue-200"
                                                                                    >
                                                                                        {label}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex items-center justify-between mt-auto">
                                                                        <div className="flex flex-col">
                                                                            {book.originalPrice !== book.discountPrice ? (
                                                                                <>
                                                                                    <span className="text-green-600 font-bold text-sm">
                                                                                        {formatPrice(book.discountPrice)}
                                                                                    </span>
                                                                                    <div className="flex items-center gap-1">
                                                                                        <span className="text-[10px] text-gray-500 line-through">
                                                                                            {formatPrice(book.originalPrice)}
                                                                                        </span>
                                                                                    </div>
                                                                                </>
                                                                            ) : (
                                                                                <span className="font-bold text-sm text-gray-900">
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
                                            </>
                                        ) : (
                                            <div className="text-center py-6 text-gray-600">
                                                Promo ini berlaku untuk semua buku atau belum menentukan buku spesifik.
                                            </div>
                                        )}

                                        <div className="text-center mt-6">
                                            <button
                                                onClick={() => handlePromoClick(promo)}
                                                className="cursor-pointer inline-block px-6 py-3 bg-linear-to-r from-yellow-500 to-yellow-600 text-white text-sm rounded-lg font-medium hover:from-yellow-600 hover:to-yellow-700 transition"
                                            >
                                                Lihat Selengkapnya
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}