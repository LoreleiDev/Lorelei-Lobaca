import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./UseAuth";

const WishlistContext = createContext();

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
    return context;
};

export const WishlistProvider = ({ children }) => {
    const { isLoggedIn, token } = useAuth();
    const [wishlist, setWishlist] = useState(() => {
        if (typeof window !== "undefined") {
            const cached = localStorage.getItem("wishlist");
            return cached ? JSON.parse(cached) : [];
        }
        return [];
    });
    const [wishlistCount, setWishlistCount] = useState(() => {
        if (typeof window !== "undefined") {
            const cached = localStorage.getItem("wishlist");
            return cached ? JSON.parse(cached).length : 0;
        }
        return 0;
    });
    const [loading, setLoading] = useState(true);

    const pendingOperations = useRef(new Set());

    const updateWishlistCount = useCallback((count) => {
        setWishlistCount(count);
    }, []);

    const fetchWishlist = useCallback(async () => {
        if (!isLoggedIn) {
            setWishlist([]);
            setWishlistCount(0);
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/wishlist", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setWishlist(data);
                setWishlistCount(data.length);
                localStorage.setItem("wishlist", JSON.stringify(data));
            } else {
                setWishlist([]);
                setWishlistCount(0);
            }
        } catch (err) {
            console.error("Gagal fetch wishlist:", err);
            setWishlist([]);
            setWishlistCount(0);
        } finally {
            setLoading(false);
        }
    }, [isLoggedIn, token]);

    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

    const addToWishlist = (bukuId) => {
        const idStr = String(bukuId);
        setWishlist(prev => {
            if (!prev.some(b => String(b.id) === idStr)) {
                const newItem = { id: idStr };
                const updated = [...prev, newItem];
                setWishlistCount(updated.length);
                localStorage.setItem("wishlist", JSON.stringify(updated));
                return updated;
            }
            return prev;
        });
    };

    const removeFromWishlist = (bukuId) => {
        const idStr = String(bukuId);
        setWishlist(prev => {
            const updated = prev.filter(b => String(b.id) !== idStr);
            setWishlistCount(updated.length);
            localStorage.setItem("wishlist", JSON.stringify(updated));
            return updated;
        });
    };

    const isInWishlist = (bukuId) => {
        const idStr = String(bukuId);
        if (wishlist.length > 0) {
            return wishlist.some(book => String(book.id) === idStr);
        }
        if (typeof window === "undefined") return false;
        const cached = localStorage.getItem("wishlist");
        if (!cached) return false;
        try {
            const list = JSON.parse(cached);
            return list.some(item => String(item.id) === idStr);
        } catch {
            return false;
        }
    };

    const toggleWishlist = useCallback(async (bukuId) => {
        const idStr = String(bukuId);

        if (pendingOperations.current.has(idStr)) {
            return;
        }

        const wasInWishlist = isInWishlist(idStr);
        pendingOperations.current.add(idStr);

        if (wasInWishlist) {
            removeFromWishlist(idStr);
        } else {
            addToWishlist(idStr);
        }

        if (!token) {
            pendingOperations.current.delete(idStr);
            return;
        }

        try {
            if (wasInWishlist) {
                await fetch(`/api/wishlist/${idStr}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await fetch("/api/wishlist", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ buku_id: idStr })
                });
            }
        } catch (err) {
            console.error("Wishlist sync error:", err);
            if (wasInWishlist) {
                addToWishlist(idStr);
            } else {
                removeFromWishlist(idStr);
            }
        } finally {
            pendingOperations.current.delete(idStr);
        }
    }, [isInWishlist, token, addToWishlist, removeFromWishlist]);

    return (
        <WishlistContext.Provider
            value={{
                wishlist,
                wishlistCount,
                loading,
                isInWishlist,
                toggleWishlist,
                updateWishlistCount,
                refetch: fetchWishlist
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
};