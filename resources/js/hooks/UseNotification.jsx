import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";

export function useNotification() {
    const { isLoggedIn, token } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchNotifications = useCallback(async () => {
        if (!isLoggedIn || !token) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            const res = await fetch("/api/notifications", {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setNotifications(data.data || []);
                    setUnreadCount(data.unread_count || 0);
                } else {
                    setNotifications([]);
                    setUnreadCount(0);
                }
            } else {
                setNotifications([]);
                setUnreadCount(0);
            }
        } catch (err) {
            console.error("Gagal fetch notifications:", err);
            setError(err.message || "Terjadi kesalahan saat memuat notifikasi");
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    }, [isLoggedIn, token]);

    useEffect(() => {
        fetchNotifications();
        
        // Polling setiap 30 detik untuk update notifikasi
        const interval = setInterval(() => {
            fetchNotifications();
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const markAsRead = async (notificationId) => {
        if (!token) return false;

        try {
            const res = await fetch(`/api/notifications/${notificationId}/read`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    // Update local state
                    setNotifications(prev => 
                        prev.map(n => 
                            n.notification_id === notificationId 
                                ? { ...n, is_read: true, read_at: new Date().toISOString() } 
                                : n
                        )
                    );
                    setUnreadCount(prev => Math.max(0, prev - 1));
                    return true;
                }
            }
            return false;
        } catch (err) {
            console.error("Mark as read error:", err);
            return false;
        }
    };

    const markAllAsRead = async () => {
        if (!token) return false;

        try {
            const res = await fetch("/api/notifications/mark-all-read", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    // Update local state
                    setNotifications(prev => 
                        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
                    );
                    setUnreadCount(0);
                    return true;
                }
            }
            return false;
        } catch (err) {
            console.error("Mark all as read error:", err);
            return false;
        }
    };

    const removeNotification = async (notificationId) => {
        if (!token) return false;

        try {
            const res = await fetch(`/api/notifications/${notificationId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    // Update local state
                    setNotifications(prev => 
                        prev.filter(n => n.notification_id !== notificationId)
                    );
                    // Update unread count if needed
                    const removedNotification = notifications.find(n => n.notification_id === notificationId);
                    if (removedNotification && !removedNotification.is_read) {
                        setUnreadCount(prev => Math.max(0, prev - 1));
                    }
                    return true;
                }
            }
            return false;
        } catch (err) {
            console.error("Remove notification error:", err);
            return false;
        }
    };

    const removeAllRead = async () => {
        if (!token) return false;

        try {
            const res = await fetch("/api/notifications/clear-read", {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    // Update local state
                    setNotifications(prev => prev.filter(n => !n.is_read));
                    return true;
                }
            }
            return false;
        } catch (err) {
            console.error("Remove all read error:", err);
            return false;
        }
    };

    const getUnreadNotifications = () => {
        return notifications.filter(n => !n.is_read);
    };

    const getReadNotifications = () => {
        return notifications.filter(n => n.is_read);
    };

    return {
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        removeNotification,
        removeAllRead,
        getUnreadNotifications,
        getReadNotifications,
        refetch: fetchNotifications
    };
}