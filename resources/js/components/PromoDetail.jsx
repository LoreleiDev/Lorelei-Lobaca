import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Loading from "@/components/ui/Loading";
import { CartProvider } from '../hooks/UseCart';
import { Calendar, Tag, ChevronLeft } from "lucide-react";

const getCategoryLabels = (categoryString, categories) => {
    if (!categoryString || !categories?.length) return [];
    
    const cats = Array.isArray(categoryString) 
        ? categoryString 
        : categoryString.split(',').map(cat => cat.trim()).filter(Boolean);
    
    return cats.map(cat => {
        const found = categories.find(c => 
            String(c.value) === String(cat) || 
            String(c.slug) === String(cat) || 
            String(c.id) === String(cat)
        );
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
    
    const [BOOK_CATEGORIES, setBookCategories] = useState([]);
    const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/public/categories', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                });

                if (!res.ok) throw new Error('Gagal mengambil kategori');

                const data = await res.json();
                
                const formatted = Array.isArray(data) ? data.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    slug: cat.slug,
                    value: cat.slug || cat.value,
                    label: cat.label || cat.name,
                })) : [];

                setBookCategories(formatted);
            } catch (err) {
                console.error('Error fetching categories:', err);
                setBookCategories([]);
            } finally {
                setIsCategoriesLoading(false);
            }
        };

        fetchCategories();
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

    if (loading || isCategoriesLoading) {
        return (
            <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
                <Loading />
            </div>
        );
    }

    if (!promo) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="pt-16 pb-4 px-4 bg-linear-to-r from-blue-600 to-yellow-500">
                    <div className="max-w-6xl mx-auto">
                        <Link to="/promo" className="inline-block">
                            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-sm border border-white/30 hover:bg-white/30 hover:-translate-x-1 transition-all duration-300">
                                <ChevronLeft className="w-4 h-4" />
                                <span>Kembali</span>
                            </div>
                        </Link>
                    </div>
                </div>
                <div className="py-16 text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Promo Tidak Ditemukan</h2>
                    <Link to="/promo" className="inline-block px-6 py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition">
                        Kembali ke Promo
                    </Link>
                </div>
            </div>
        );
    }

    const visibleBooks = promo.books || [];

    return (
        <CartProvider>
            <div className="min-h-screen bg-gray-50">
                <div className="pt-16 pb-4 px-4 bg-linear-to-r from-blue-600 to-yellow-500">
                    <div className="max-w-6xl mx-auto">
                        <Link
                            to="/promo"
                            className="inline-block mb-3"
                        >
                            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-sm border border-white/30 hover:bg-white/30 hover:-translate-x-1 transition-all duration-300">
                                <ChevronLeft className="w-4 h-4" />
                                <span>Kembali</span>
                            </div>
                        </Link>

                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                <Tag className="w-3 h-3 text-white" />
                            </div>
                            <h1 
                                id="promo-header"
                                className="text-xl md:text-2xl text-white tracking-tight" 
                                style={{ fontFamily: "Rubik Mono One" }}
                            >
                                {promo.name}
                            </h1>
                        </div>

                        {promo.description && (
                            <p className="text-blue-100 text-xs max-w-2xl mb-2">
                                {promo.description}
                            </p>
                        )}

                        {promo.endDate && (
                            <div className="flex items-center gap-1.5 text-blue-100 text-xs">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>
                                    Berlaku hingga: {new Date(promo.endDate).toLocaleDateString("id-ID", {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>
                        )}

                        {!promo.endDate && (
                            <div className="flex items-center gap-1.5 text-blue-100 text-xs">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Berlaku selamanya</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="py-6 px-4 max-w-6xl mx-auto">
                    {visibleBooks.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-5xl mb-4">📚</div>
                            <h2 className="text-xl font-bold text-gray-800 mb-3">Tidak Ada Buku dalam Promo</h2>
                            <p className="text-gray-600 mb-6">Promo ini sedang dalam persiapan atau belum memiliki buku spesifik.</p>
                            <Link
                                to="/buku"
                                className="inline-block px-6 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-full font-medium hover:from-blue-700 hover:to-blue-800 transition"
                            >
                                Jelajahi Buku Lainnya
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4">
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Buku dalam Promo ({visibleBooks.length})
                                </h2>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {visibleBooks.map((book) => {
                                    const discountPercent = getDiscountPercent(book.originalPrice, book.discountPrice);
                                    const categoryLabels = getCategoryLabels(book.category, BOOK_CATEGORIES);

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
                                                            Baru
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </CartProvider>
    );
}