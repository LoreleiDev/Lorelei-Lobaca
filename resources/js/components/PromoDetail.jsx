import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import NavbarHome from "@/components/ui/NavbarHome";
import Loading from "@/components/ui/Loading";
import AnimatedWaves from "./ui/AnimatedWaves";

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

const fetchBooksByIds = async (bookIds) => {
    if (bookIds.length === 0) return {};
    const params = new URLSearchParams(bookIds.map(id => ['ids[]', id])).toString();
    try {
        const res = await fetch(`/api/books?${params}`);
        if (res.ok) {
            const books = await res.json();
            return books.reduce((map, book) => {
                map[book.id] = book;
                return map;
            }, {});
        }
    } catch (error) {
        console.error("Gagal fetch buku:", error);
    }
    return {};
};

export default function PromoDetailPage() {
    document.title = "Promo - Lobaca";
    const { id } = useParams();
    const [promo, setPromo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const header = document.getElementById("promo-header");
            if (header) {
                const rect = header.getBoundingClientRect();
                setScrolled(rect.bottom < 0);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const fetchPromo = async () => {
            try {
                const res = await fetch(`/api/promos/${id}`);
                if (res.ok) {
                    const promo = await res.json();
                    if (promo.books && promo.books.length > 0) {
                        const bookIds = promo.books.map(b => b.id);
                        const bookDetailsMap = await fetchBooksByIds(bookIds);
                        const fullBooks = promo.books.map(book => ({
                            ...book,
                            ...bookDetailsMap[book.id]
                        }));
                        setPromo({ ...promo, books: fullBooks });
                    } else {
                        setPromo(promo);
                    }
                }
            } catch (err) {
                console.error("Gagal memuat detail promo:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPromo();
    }, [id]);

    if (loading) {
        return (
            <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
                <Loading />
            </div>
        );
    }

    if (!promo) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
                <NavbarHome />
                <div style={{
                    padding: '4rem 1rem',
                    textAlign: 'center'
                }}>
                    <h2 style={{
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: '#1f2937',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                        marginBottom: '1rem'
                    }}>
                        Promo Tidak Ditemukan
                    </h2>
                    <Link
                        to="/promo"
                        style={{
                            display: 'inline-block',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#d97706',
                            color: 'white',
                            borderRadius: '0.5rem',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                            transition: 'transform 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.transform = 'scale(1.05)';
                            e.target.style.backgroundColor = '#b45309';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.backgroundColor = '#d97706';
                        }}
                    >
                        Kembali ke Promo
                    </Link>
                </div>
            </div>
        );
    }

    const visibleBooks = promo.books || [];

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f9fafb',
            position: 'relative',
            overflowX: 'hidden'
        }}>
            <NavbarHome />
            <Link
                to="/promo"
                style={{
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    textDecoration: 'none'
                }}
            >
                <div style={{
                    position: 'relative',
                    zIndex: 40,
                    padding: '1rem 0 0 1rem',
                    cursor: 'pointer'
                }}>
                    <div style={{
                        display: 'inline-block',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '0.5rem',
                        padding: '0.5rem 1rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        border: '1px solid #e5e7eb',
                        transition: 'transform 0.3s ease'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '1rem', width: '1rem', fill: '#eab308' }} viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>

                            Kembali ke Promo

                        </div>
                    </div>
                </div>
            </Link>
            <div style={{
                padding: '1rem',
                textAlign: 'center',
                zIndex: 10,
                position: 'relative'
            }}>
                <h1
                    id="promo-header"
                    style={{
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        color: '#1f2937',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.3), -1px -1px 0 #ffffff, 1px 1px 0 #ffffff',
                        letterSpacing: '2px',
                        fontFamily: 'Rubik Mono One, sans-serif',
                        maxWidth: '80%',
                        margin: '0 auto'
                    }}
                >
                    {promo.name}
                </h1>
            </div>

            <div style={{
                padding: '1rem',
                paddingBottom: '3rem',
                position: 'relative',
                zIndex: 10
            }}>
                <AnimatedWaves />
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    <>
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
                </div>
            </div>
        </div>
    );
}