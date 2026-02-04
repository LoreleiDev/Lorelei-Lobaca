import { useState, useContext, createContext, useCallback, useEffect } from 'react';
import axios from 'axios';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};

export const CartProvider = ({ children }) => {
    const [cartItemCount, setCartItemCount] = useState(0);

    const updateCartItemCount = useCallback((count) => {
        setCartItemCount(count);
    }, []);

    const loadCartCount = useCallback(async () => {
        const token = localStorage.getItem('user_token');
        if (!token) {
            setCartItemCount(0);
            return;
        }
        try {
            const res = await axios.get('/api/cart/count', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setCartItemCount(res.data.data.total_items || 0);
            }
        } catch (error) {
            console.error('Error loading cart count:', error);
            setCartItemCount(0);
        }
    }, []);

    const addToCart = async (bukuId, jumlah = 1) => {
        const token = localStorage.getItem('user_token');
        if (!token) return false;

        try {
            const res = await axios.post('/api/cart', { buku_id: bukuId, jumlah }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success && res.data.data?.total_cart_count !== undefined) {
                updateCartItemCount(res.data.data.total_cart_count);
                return true;
            }
            return false;
        } catch (err) {
            console.error("Add to cart error:", err);
            return false;
        }
    };

    const removeFromCart = async (itemId) => {
        const token = localStorage.getItem('user_token');
        if (!token) return false;

        try {
            const res = await axios.delete(`/api/cart/${itemId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success && res.data.data?.total_cart_count !== undefined) {
                updateCartItemCount(res.data.data.total_cart_count);
                return true;
            }
            return false;
        } catch (err) {
            console.error("Remove from cart error:", err);
            return false;
        }
    };

    const updateCartItemQuantity = async (itemId, jumlah) => {
        const token = localStorage.getItem('user_token');
        if (!token) return false;

        try {
            const res = await axios.put(`/api/cart/${itemId}`, { jumlah }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success && res.data.data?.total_cart_count !== undefined) {
                updateCartItemCount(res.data.data.total_cart_count);
                return true;
            }
            return false;
        } catch (err) {
            console.error("Update cart item error:", err);
            return false;
        }
    };

    const clearCart = async () => {
        const token = localStorage.getItem('user_token');
        if (!token) return false;

        try {
            const res = await axios.post('/api/cart/clear', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success && res.data.data?.total_cart_count !== undefined) {
                updateCartItemCount(res.data.data.total_cart_count);
                return true;
            }
            return false;
        } catch (err) {
            console.error("Clear cart error:", err);
            return false;
        }
    };

    const refetch = useCallback(async () => {
        await loadCartCount();
    }, [loadCartCount]);

    const initializeCart = useCallback(async () => {
        await loadCartCount();
    }, [loadCartCount]);

    useEffect(() => {
        initializeCart();
    }, [initializeCart]);

    return (
        <CartContext.Provider
            value={{
                cartItemCount,
                addToCart,
                removeFromCart,
                clearCart,
                updateCartItemCount,
                updateCartItemQuantity,
                refetch,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};