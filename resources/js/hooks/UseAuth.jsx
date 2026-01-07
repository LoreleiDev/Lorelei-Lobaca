import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export function useAuth() {
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const fetchProfile = useCallback(async () => {
        const token = localStorage.getItem("user_token");
        if (!token) {
            setProfile(null);
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/profile", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                }
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
            } else {
                setProfile(null);
            }
        } catch (err) {
            console.error("Profile fetch error:", err);
            setProfile(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const logout = useCallback(async () => {
        try {
            const token = localStorage.getItem("user_token");
            if (token) {
                await fetch("/api/logout", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                });
            }
        } catch (err) {
            console.error("Logout API error:", err);
        } finally {
            localStorage.removeItem("user_token");
            setProfile(null);
        }
    }, []);

    const requireLogin = (actionName = "fitur ini") => {
        return Swal.fire({
            title: "Belum Login",
            text: `Anda perlu login terlebih dahulu untuk mengakses ${actionName}.`,
            icon: "info",
            confirmButtonText: "Login",
            showCancelButton: true,
            cancelButtonText: "Batal"
        }).then((result) => {
            if (result.isConfirmed) {
                navigate("/login");
                return true;
            }
            return false;
        });
    };

    const token = localStorage.getItem("user_token");
    const isLoggedIn = !!token;

    return { profile, isLoggedIn, isLoading, requireLogin, logout, token };
}