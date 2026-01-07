import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
    Search,
    ShoppingCart,
    Heart,
    Bell,
    User,
    Filter,
    X,
    Menu,
    ArrowRight,
    ChevronDown,
    ShoppingBag,
    Truck,
    LogOut,
    LogIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Swal from 'sweetalert2';
import { useAuth } from "@/hooks/useAuth";

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

const getCategoryLabel = (categoryString) => {
    if (!categoryString) return [];
    const categories = categoryString.split(',').map(cat => cat.trim()).filter(Boolean);
    return categories.map(cat => {
        const found = BOOK_CATEGORIES.find(c => c.value === cat);
        return found ? found.label : cat;
    });
};

const getDiscountPercent = (originalPrice, discountPrice) => {
    if (!originalPrice || !discountPrice || originalPrice <= discountPrice) return null;
    return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
};

const searchDropdownVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: { opacity: 1, scale: 1, y: 0 },
};

const mobileMenuVariants = {
    closed: { x: "100%" },
    open: { x: 0 },
};

const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

export default function NavbarHome() {
    const navigate = useNavigate();
    const { profile, isLoggedIn, isLoading, requireLogin, logout } = useAuth();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [activeNotificationTab, setActiveNotificationTab] = useState("pesanan");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

    const searchRef = useRef(null);
    const profileRef = useRef(null);


    useEffect(() => {
        if (!searchQuery.trim() && selectedCategories.length === 0) {
            setSearchResults([]);
            return;
        }
        const delay = setTimeout(async () => {
            setIsSearching(true);
            let finalResults = [];
            try {
                if (searchQuery.trim()) {
                    const params = new URLSearchParams();
                    params.append('q', searchQuery.trim());
                    selectedCategories.forEach(cat => params.append('category', cat));
                    const res = await fetch(`/api/search/books?${params.toString()}`);
                    finalResults = res.ok ? await res.json() : [];
                } else if (selectedCategories.length > 0) {
                    const fetchPromises = selectedCategories.map(cat => {
                        const p = new URLSearchParams();
                        p.append('category', cat);
                        return fetch(`/api/search/books?${p.toString()}`)
                            .then(r => (r.ok ? r.json() : []))
                            .catch(() => []);
                    });
                    const allResults = await Promise.all(fetchPromises);
                    const resultMap = new Map();
                    for (const books of allResults) {
                        for (const book of books) {
                            if (!resultMap.has(book.id)) {
                                resultMap.set(book.id, book);
                            }
                        }
                    }
                    finalResults = Array.from(resultMap.values());
                }
                setSearchResults(finalResults);
            } catch (error) {
                console.error("Error fetching search results:", error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [searchQuery, selectedCategories]);


    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    const toggleCategory = (value) => {
        setSelectedCategories((prev) =>
            prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
        );
    };

    const clearAllCategories = () => {
        setSelectedCategories([]);
    };

    const handleViewAllNotifications = () => {
        if (!isLoggedIn) {
            requireLogin("fitur Notifikasi");
            return;
        }
        navigate("/notifications");
        setIsMobileMenuOpen(false);
    };

    const handleProfileNavigation = () => {
        if (!isLoggedIn) {
            requireLogin("fitur Profil");
            return;
        }
        navigate("/profile");
        setIsMobileMenuOpen(false);
    };

    const handleWishlist = () => {
        if (!isLoggedIn) {
            requireLogin("fitur Wishlist");
            return;
        }
        navigate("/wishlist");
        setIsMobileMenuOpen(false);
    };

    const handlecart = () => {
        if (!isLoggedIn) {
            requireLogin("fitur Keranjang");
            return;
        }
        navigate("/cart");
        setIsMobileMenuOpen(false);
    };

    const handleTitipJual = () => {
        if (!isLoggedIn) {
            requireLogin("fitur Titip Jual");
            return;
        }
        navigate("/titip-jual");
        setIsMobileMenuOpen(false);
    };

    const handleCekOngkir = () => {
        if (!isLoggedIn) {
            requireLogin("fitur Cek Ongkir");
            return;
        }
        navigate("/cek-ongkir");
        setIsMobileMenuOpen(false);
    };

    const handleSearchSubmit = (e) => {
        if (e && typeof e.preventDefault === "function") e.preventDefault();
        if (searchQuery.trim() || selectedCategories.length > 0) {
            const params = new URLSearchParams();
            if (searchQuery.trim()) params.append('q', encodeURIComponent(searchQuery));
            selectedCategories.forEach(cat => params.append('category', cat));
            navigate(`/search?${params.toString()}`);
            setSearchQuery("");
            setSelectedCategories([]);
            setShowDropdown(false);
            setIsMobileSearchOpen(false);
        }
    };

    const handleSelectResult = (book) => {
        navigate(`/buku/${book.slug}`, { state: { id: book.id } });
        setSearchQuery("");
        setSelectedCategories([]);
        setShowDropdown(false);
        setIsMobileSearchOpen(false);
    };

    const handleSearchFocus = () => {
        setShowDropdown(true);
    };

    const handleCategoryButtonClick = (e) => {
        e.stopPropagation();
        setShowDropdown(!showDropdown);
    };


    const handleLogout = async () => {
        const result = await Swal.fire({
            title: 'Yakin ingin keluar?',
            text: "Anda akan diarahkan ke halaman utama setelah logout.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Logout!',
            cancelButtonText: 'Batal',
        });
        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('user_token');
                if (token) {
                    await fetch('/api/logout', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                        },
                    });
                }
            } catch (err) {
                console.error('Logout error:', err);
            } finally {
                await logout();
                navigate('/');
                Swal.fire('Berhasil!', 'Anda telah logout.', 'success');
            }
        }
    };

    return (
        <>
            <motion.nav
                className="bg-primary text-primary-foreground sticky top-0 z-40"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                <div className="flex items-center justify-between px-4 py-3 gap-4 md:px-6 md:gap-6">
                    <div>
                        <Button
                            onClick={() => navigate("/")}
                            className="text-xl md:text-2xl tracking-wider hover:opacity-80 transition-opacity opacity-75 cursor-pointer"
                            style={{ fontFamily: "Anton" }}
                        >
                            LOBACA
                        </Button>
                    </div>

                    {/* Desktop Search */}
                    <div className="hidden md:flex items-center gap-2 flex-1 max-w-2xl relative" ref={searchRef}>
                        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                            <div className="flex items-center bg-black rounded-lg px-3 py-2">
                                <div className="relative">
                                    <Button
                                        type="button"
                                        onClick={handleCategoryButtonClick}
                                        className={`p-2 mr-2 rounded-md transition-all duration-200 cursor-pointer flex items-center gap-2 ${selectedCategories.length > 0
                                            ? "bg-white/20 text-white"
                                            : "hover:bg-white/10 text-white/80"
                                            }`}
                                        aria-label="Filter categories"
                                    >
                                        <Filter size={16} />
                                        <span className="text-xs">
                                            {selectedCategories.length > 0
                                                ? `${selectedCategories.length} kategori`
                                                : "Kategori"}
                                        </span>
                                        <ChevronDown
                                            size={14}
                                            className={`transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`}
                                        />
                                    </Button>
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={handleSearchFocus}
                                    placeholder="Cari buku, penulis, atau kategori..."
                                    className="bg-transparent text-white placeholder-white/60 outline-none flex-1 text-sm"
                                />
                                <Button
                                    type="submit"
                                    className="p-1.5 ml-1 hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                                    aria-label="Search"
                                >
                                    <Search size={16} className="text-white" />
                                </Button>
                            </div>

                            <AnimatePresence>
                                {showDropdown && (
                                    <motion.div
                                        variants={searchDropdownVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="hidden"
                                        className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
                                    >
                                        <div className="p-3 border-b border-gray-200">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="font-semibold text-sm text-gray-800">Filter Kategori</h3>
                                                {selectedCategories.length > 0 && (
                                                    <Button
                                                        onClick={clearAllCategories}
                                                        className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded cursor-pointer"
                                                        size="sm"
                                                    >
                                                        Hapus semua
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="space-y-1 max-h-48 overflow-y-auto overflow-x-hidden">
                                                {BOOK_CATEGORIES.map((item) => (
                                                    <label
                                                        key={item.value}
                                                        className="flex items-center gap-3 p-2 bg-white text-gray-700 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedCategories.includes(item.value)}
                                                            onChange={() => toggleCategory(item.value)}
                                                            className="w-4 h-4 rounded cursor-pointer"
                                                        />
                                                        <span className="text-sm">{item.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="max-h-80 overflow-y-auto overflow-x-hidden">
                                            <div className="p-3 border-b border-gray-200 bg-gray-50">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-semibold text-sm text-gray-800">Hasil Pencarian</h3>
                                                    <span className="text-xs text-gray-500">
                                                        {isSearching ? "Mencari..." : `${searchResults.length} hasil`}
                                                    </span>
                                                </div>
                                            </div>
                                            {isSearching ? (
                                                <div className="p-6 flex flex-col items-center justify-center">
                                                    <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mb-2"></div>
                                                    <p className="text-gray-500 text-xs">Mencari buku...</p>
                                                </div>
                                            ) : searchResults.length > 0 ? (
                                                <div className="p-1">
                                                    {searchResults.map((book) => {
                                                        const discountPercent = getDiscountPercent(book.originalPrice, book.discountPrice);
                                                        return (
                                                            <div
                                                                key={book.id}
                                                                onClick={() => handleSelectResult(book)}
                                                                className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex gap-2"
                                                            >
                                                                <img
                                                                    src={book.image}
                                                                    alt={book.title}
                                                                    className="w-10 h-14 object-contain bg-gray-100 rounded shrink-0"
                                                                />
                                                                <div className="min-w-0 flex-1">
                                                                    <h4 className="font-medium text-sm text-gray-900 line-clamp-1 truncate">
                                                                        {book.title}
                                                                    </h4>
                                                                    <p className="text-xs text-gray-600 truncate">oleh {book.author}</p>
                                                                    <div className="flex items-center justify-between mt-1">
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-[10px] text-green-600 font-bold">
                                                                                Rp {book.discountPrice.toLocaleString("id-ID")}
                                                                            </span>
                                                                            {discountPercent && (
                                                                                <span className="text-[10px] px-1 rounded bg-red-100 text-red-600 font-bold">
                                                                                    -{discountPercent}%
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {getCategoryLabel(book.category).map((label, idx) => (
                                                                                <span
                                                                                    key={idx}
                                                                                    className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full truncate"
                                                                                >
                                                                                    {label}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (searchQuery.trim() || selectedCategories.length > 0) && !isSearching ? (
                                                <div className="p-6 text-center">
                                                    <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                                                        <Search size={20} className="text-gray-400" />
                                                    </div>
                                                    <p className="text-gray-700 text-sm font-medium mb-1">Tidak ada hasil yang ditemukan</p>
                                                    <p className="text-gray-500 text-xs">Coba kata kunci lain atau pilih kategori berbeda</p>
                                                </div>
                                            ) : (
                                                <div className="p-6 text-center">
                                                    <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                                                        <Search size={20} className="text-gray-400" />
                                                    </div>
                                                    <p className="text-gray-700 text-sm font-medium mb-1">Mulai pencarian Anda</p>
                                                    <p className="text-gray-500 text-xs">Ketik judul buku atau pilih kategori untuk memulai</p>
                                                </div>
                                            )}
                                        </div>
                                        {(searchQuery.trim() || selectedCategories.length > 0) && (
                                            <div className="p-3 border-t border-gray-200 bg-gray-50">
                                                <Button
                                                    onClick={handleSearchSubmit}
                                                    className="w-full bg-black hover:bg-gray-800 text-white py-2 rounded-md cursor-pointer text-sm font-medium transition-colors"
                                                >
                                                    Lihat Semua Hasil
                                                    <ArrowRight size={14} className="ml-2" />
                                                </Button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </form>
                    </div>

                    {/* Desktop Icons */}
                    <div className="hidden md:flex items-center gap-3 relative" ref={profileRef}>
                        <Button
                        onClick={handlecart}
                            className="p-2 hover:bg-primary-foreground/10 rounded-md transition-colors cursor-pointer"
                            aria-label="Shopping cart"
                        >
                            <ShoppingCart size={18} />
                        </Button>
                        <Button
                        onClick={handleWishlist}
                            className="p-2 hover:bg-primary-foreground/10 rounded-md transition-colors cursor-pointer"
                            aria-label="Wishlist"
                        >
                            <Heart size={18} />
                        </Button>
                        <Button
                            onClick={handleViewAllNotifications}
                            className="p-2 hover:bg-primary-foreground/10 rounded-md transition-colors cursor-pointer"
                            aria-label="Notifications"
                        >
                            <Bell size={18} />
                        </Button>

                        {/* Profil atau Login */}
                        {isLoading ? (
                            <Button
                                className="mx-1 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center cursor-not-allowed"
                                disabled
                            >
                                <User size={18} className="text-white" />
                            </Button>
                        ) : isLoggedIn ? (
                            <div className="relative">
                                <Button
                                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                    className="mx-1 w-10 h-10 rounded-full hover:bg-primary-foreground/10 transition-colors cursor-pointer p-0 justify-center flex items-center"
                                    aria-label="User profile"
                                >
                                    {profile?.avatar ? (
                                        <img
                                            src={profile.avatar}
                                            alt="Profil"
                                            className="w-full h-full rounded-full object-cover border border-white/30"
                                        />
                                    ) : (
                                        <User size={18} className="text-white" />
                                    )}
                                </Button>

                                {isProfileDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 overflow-hidden"
                                        >
                                            <div className="px-4 py-3 border-b border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
                                                        {profile?.avatar ? (
                                                            <img src={profile.avatar} alt="Profil" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                                                                <User size={16} className="text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm text-gray-900 truncate">
                                                            {profile?.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="py-2">
                                                <Button
                                                    onClick={() => {
                                                        navigate("/profile");
                                                        setIsProfileDropdownOpen(false);
                                                    }}
                                                    className="cursor-pointer w-full justify-start px-4 py-3 text-left hover:bg-blue-50 text-sm transition-all duration-200"
                                                    variant="ghost"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                                                            <User size={14} className="text-blue-600" />
                                                        </div>
                                                        <span className="text-gray-700">Profil Saya</span>
                                                    </div>
                                                </Button>
                                                <Button
                                                    onClick={() => {
                                                        navigate("/titip-jual");
                                                        setIsProfileDropdownOpen(false);
                                                    }}
                                                    className="cursor-pointer w-full justify-start px-4 py-3 text-left hover:bg-green-50 text-sm transition-all duration-200"
                                                    variant="ghost"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center">
                                                            <ShoppingBag size={14} className="text-green-600" />
                                                        </div>
                                                        <span className="text-gray-700">Titip Jual</span>
                                                    </div>
                                                </Button>
                                                <Button
                                                    onClick={() => {
                                                        navigate("/cek-ongkir");
                                                        setIsProfileDropdownOpen(false);
                                                    }}
                                                    className="cursor-pointer w-full justify-start px-4 py-3 text-left hover:bg-orange-50 text-sm transition-all duration-200"
                                                    variant="ghost"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center">
                                                            <Truck size={14} className="text-orange-600" />
                                                        </div>
                                                        <span className="text-gray-700">Cek Ongkir</span>
                                                    </div>
                                                </Button>
                                            </div>
                                            <div className="border-t border-gray-100 my-1" />
                                            <Button
                                                onClick={handleLogout}
                                                className="cursor-pointer w-full justify-start px-4 py-3 text-left hover:bg-red-50 text-sm transition-all duration-200"
                                                variant="ghost"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center">
                                                        <LogOut size={14} className="text-red-600" />
                                                    </div>
                                                    <span className="text-red-600 font-medium">Logout</span>
                                                </div>
                                            </Button>
                                        </motion.div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <Button
                                onClick={() => navigate("/login")}
                                className="text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer"
                            >
                                Login
                            </Button>
                        )}
                    </div>

                    {/* Mobile Icons */}
                    <div className="flex md:hidden items-center gap-3">
                        <Button
                            onClick={() => setIsMobileSearchOpen(true)}
                            className="p-1.5 hover:bg-primary-foreground/10 rounded-md transition-colors cursor-pointer"
                            aria-label="Search"
                        >
                            <Search size={18} />
                        </Button>
                        <Button
                        onClick={handlecart}
                            className="p-1.5 hover:bg-primary-foreground/10 rounded-md transition-colors cursor-pointer"
                            aria-label="Shopping cart"
                        >
                            <ShoppingCart size={18} />
                        </Button>
                        <Button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-1.5 hover:bg-primary-foreground/10 rounded-md transition-colors cursor-pointer"
                            aria-label="Menu"
                        >
                            <Menu size={18} />
                        </Button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Search */}
            {isMobileSearchOpen && (
                <>
                    <motion.div
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="fixed inset-0 z-50 bg-black/50"
                        onClick={() => setIsMobileSearchOpen(false)}
                    />
                    <motion.div
                        variants={{
                            hidden: { y: "100%", opacity: 0 },
                            visible: { y: 0, opacity: 1 },
                        }}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[85vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b flex items-center gap-2">
                            <Button
                                onClick={() => setIsMobileSearchOpen(false)}
                                className="p-1.5 rounded-md cursor-pointer"
                                aria-label="Close"
                            >
                                <X size={18} />
                            </Button>
                            <form onSubmit={handleSearchSubmit} className="flex-1">
                                <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
                                    <Search size={16} className="text-gray-500 mr-2" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Cari buku, penulis, atau kategori..."
                                        className="bg-transparent text-gray-800 outline-none flex-1 text-sm"
                                        autoFocus
                                    />
                                </div>
                            </form>
                        </div>
                        <div className="p-4 space-y-4 max-h-[65vh] overflow-y-auto pb-[70px]">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-sm text-gray-800">Filter Kategori</h3>
                                    {selectedCategories.length > 0 && (
                                        <Button
                                            onClick={clearAllCategories}
                                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded cursor-pointer"
                                            size="sm"
                                        >
                                            Hapus semua
                                        </Button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {BOOK_CATEGORIES.map((item) => (
                                        <Button
                                            key={item.value}
                                            onClick={() => toggleCategory(item.value)}
                                            variant={selectedCategories.includes(item.value) ? "default" : "outline"}
                                            className="cursor-pointer text-xs px-3 py-1.5 rounded-full"
                                        >
                                            {item.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-sm text-gray-800">Hasil Pencarian</h3>
                                    <span className="text-xs text-gray-500">
                                        {isSearching ? "Mencari..." : `${searchResults.length} hasil`}
                                    </span>
                                </div>
                                {isSearching ? (
                                    <div className="flex flex-col items-center py-8">
                                        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mb-2"></div>
                                        <p className="text-gray-500 text-xs">Mencari buku...</p>
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div className="space-y-3">
                                        {searchResults.map((book) => {
                                            const discountPercent = getDiscountPercent(book.originalPrice, book.discountPrice);
                                            return (
                                                <div
                                                    key={book.id}
                                                    onClick={() => handleSelectResult(book)}
                                                    className="flex gap-4 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                                                >
                                                    <img
                                                        src={book.image}
                                                        alt={book.title}
                                                        className="w-14 h-20 object-contain bg-gray-100 rounded shrink-0"
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="font-medium text-base text-gray-900 line-clamp-1">
                                                            {book.title}
                                                        </h4>
                                                        <p className="text-sm text-gray-600 truncate">oleh {book.author}</p>
                                                        <div className="flex items-center justify-between mt-2">
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-[10px] text-green-600 font-bold">
                                                                        Rp {book.discountPrice.toLocaleString("id-ID")}
                                                                    </span>
                                                                    {discountPercent && (
                                                                        <span className="text-[10px] px-1 rounded bg-red-100 text-red-600 font-bold">
                                                                            -{discountPercent}%
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {getCategoryLabel(book.category).map((label, idx) => (
                                                                    <span
                                                                        key={idx}
                                                                        className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full truncate"
                                                                    >
                                                                        {label}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (searchQuery.trim() || selectedCategories.length > 0) && !isSearching ? (
                                    <div className="text-center py-8">
                                        <Search size={24} className="mx-auto text-gray-400 mb-2" />
                                        <p className="text-gray-700 font-medium mb-1">Tidak ada hasil</p>
                                        <p className="text-gray-500 text-sm">Coba kata kunci lain atau ubah kategori</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Search size={24} className="mx-auto text-gray-400 mb-2" />
                                        <p className="text-gray-700 font-medium mb-1">Mulai pencarian</p>
                                        <p className="text-gray-500 text-sm">Ketik judul buku atau pilih kategori</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
                            <Button
                                onClick={handleSearchSubmit}
                                disabled={!searchQuery.trim() && selectedCategories.length === 0}
                                className={`cursor-pointer w-full py-2 text-sm ${!searchQuery.trim() && selectedCategories.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Cari
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <motion.div
                    variants={overlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="fixed inset-0 z-50 bg-black/50"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
            <motion.div
                variants={mobileMenuVariants}
                initial="closed"
                animate={isMobileMenuOpen ? "open" : "closed"}
                className="fixed top-0 right-0 h-full w-72 bg-white z-50"
            >
                <div className="flex items-center p-3 border-b">
                    <Button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-1 rounded cursor-pointer text-black bg-white hover:bg-gray-100 hover:text-blue-500"
                    >
                        <X size={18} />
                    </Button>
                </div>
                <div className="h-full overflow-y-auto">
                    <div className="flex items-center gap-3 pl-3 mt-3 border-b pb-3">
                        {isLoading ? (
                            <User size={18} />
                        ) : profile?.avatar ? (
                            <img
                                src={profile.avatar}
                                alt="Profil"
                                className="w-10 h-10 rounded-full object-cover border border-white/30"
                            />
                        ) : (
                            <User size={18} />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">
                                {profile?.name || "Anda Belum Login"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {profile?.email || ""}
                            </p>
                        </div>
                    </div>
                    <div className="pl-3 mt-3 pb-3">
                        {isLoggedIn && (
                            <>
                                <Button
                                    onClick={handleProfileNavigation}
                                    className="w-full justify-start gap-3 p-2 hover:text-blue-500 hover:bg-gray-300 rounded-md transition-colors cursor-pointer text-black"
                                    variant="ghost"
                                >
                                    <span className="text-sm">Profil Saya</span>
                                </Button>
                                <Button
                                    onClick={handleWishlist}
                                    className="w-full justify-start gap-3 p-2 hover:text-blue-500 hover:bg-gray-300 rounded-md transition-colors cursor-pointer text-black"
                                    variant="ghost"
                                >
                                    <span className="text-sm">Wishlist</span>
                                </Button>
                                <Button
                                    onClick={handleTitipJual}
                                    className="w-full justify-start gap-3 p-2 hover:text-blue-500 hover:bg-gray-300 rounded-md transition-colors cursor-pointer text-black"
                                    variant="ghost"
                                >
                                    <span className="text-sm">Titip Jual</span>
                                </Button>
                                <Button
                                    onClick={handleCekOngkir}
                                    className="w-full justify-start gap-3 p-2 hover:text-blue-500 hover:bg-gray-300 rounded-md transition-colors cursor-pointer text-black"
                                    variant="ghost"
                                >
                                    <span className="text-sm">Cek Ongkir</span>
                                </Button>
                                <div className="p-3 mb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-sm text-black">Notifikasi</h3>
                                        <Button
                                            onClick={handleViewAllNotifications}
                                            className="text-xs text-primary flex items-center gap-1 cursor-pointer"
                                            variant="ghost"
                                            size="sm"
                                        >
                                            Lihat Semua
                                            <ArrowRight size={14} />
                                        </Button>
                                    </div>
                                    <div className="flex gap-2 mb-3">
                                        <Button
                                            onClick={() => setActiveNotificationTab("pesanan")}
                                            className={`cursor-pointer flex-1 py-1.5 text-xs font-medium transition-all duration-300 ease-in-out transform ${activeNotificationTab === "pesanan"
                                                ? "bg-black text-white scale-[1.02] shadow-md"
                                                : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-[1.01] hover:shadow-sm active:scale-[0.99]"
                                                }`}
                                        >
                                            Pesanan
                                        </Button>
                                        <Button
                                            onClick={() => setActiveNotificationTab("pengajuan")}
                                            className={`cursor-pointer flex-1 py-1.5 text-xs font-medium transition-all duration-300 ease-in-out transform ${activeNotificationTab === "pengajuan"
                                                ? "bg-black text-white scale-[1.02] shadow-md"
                                                : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-[1.01] hover:shadow-sm active:scale-[0.99]"
                                                }`}
                                        >
                                            Pengajuan
                                        </Button>
                                    </div>
                                    <div className="space-y-5 mb-3 border-b">
                                        {activeNotificationTab === "pesanan" ? (
                                            <div className="text-center py-3 text-gray-500 text-xs">Tidak ada notifikasi pesanan</div>
                                        ) : (
                                            <div className="text-center py-3 text-gray-500 text-xs">Tidak ada notifikasi pengajuan</div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <Button
                                            onClick={handleLogout}
                                            className="cursor-pointer w-full justify-start px-4 py-3 text-left hover:bg-red-50 text-sm transition-all duration-200"
                                            variant="ghost"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center">
                                                    <LogOut size={14} className="text-red-600" />
                                                </div>
                                                <span className="text-red-600 font-medium">Logout</span>
                                            </div>
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}

                        {!isLoggedIn && (
                            <Button
                                onClick={() => {
                                    navigate("/login");
                                    setIsMobileMenuOpen(false);
                                }}
                                className="cursor-pointer w-full justify-start px-4 py-3 text-left bg-green-50 hover:bg-green-100 text-sm transition-all duration-200"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center">
                                        <LogIn size={14} className="text-green-600" />
                                    </div>
                                    <span className="text-green-600 font-medium">LogIn</span>
                                </div>
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>
        </>
    );
}