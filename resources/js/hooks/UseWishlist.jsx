import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";

const isBookInCachedWishlist = (bukuId) => {
    if (typeof window === "undefined") return false;
    const cached = localStorage.getItem("wishlist");
    if (!cached) return false;
    try {
        const list = JSON.parse(cached);
        return list.some(item => String(item.id) === String(bukuId));
    } catch {
        return false;
    }
};

export function useWishlist() {
    const { isLoggedIn, token } = useAuth();
    const [wishlist, setWishlist] = useState(() => {
        if (typeof window !== "undefined") {
            const cached = localStorage.getItem("wishlist");
            return cached ? JSON.parse(cached) : [];
        }
        return [];
    });
    const [loading, setLoading] = useState(true);

    const pendingOperations = useRef(new Set());

    const fetchWishlist = useCallback(async () => {
        if (!isLoggedIn) {
            setWishlist([]);
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
                localStorage.setItem("wishlist", JSON.stringify(data));
            } else {
                setWishlist([]);
            }
        } catch (err) {
            console.error("Gagal fetch wishlist:", err);
            setWishlist([]);
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
            localStorage.setItem("wishlist", JSON.stringify(updated));
            return updated;
        });
    };

    const isInWishlist = (bukuId) => {
        const idStr = String(bukuId);
        if (wishlist.length > 0) {
            return wishlist.some(book => String(book.id) === idStr);
        }
        return isBookInCachedWishlist(idStr);
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

    return {
        wishlist,
        loading,
        isInWishlist,
        toggleWishlist,
        refetch: fetchWishlist
    };
}