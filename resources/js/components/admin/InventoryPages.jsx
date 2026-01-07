import React, { useState, useEffect } from "react";
import BookInventory from "./Inventory";
import Loading from "../ui/Loading";
import Swal from "sweetalert2";

export default function InventoryPage() {
    document.title = "Inventory - Lobaca Admin";
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchBooks = async () => {
        const token = localStorage.getItem("admin_token");
        if (!token) {
            Swal.fire({
                icon: "error",
                title: "Tidak terautentikasi",
                text: "Silakan login kembali.",
            });
            return;
        }

        try {
            const res = await fetch("/api/admin/books", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            if (res.ok) {
                const data = await res.json();
                setBooks(data);
            } else {
                Swal.fire("Error", "Gagal memuat data buku.", "error");
            }
        } catch (err) {
            Swal.fire("Error", "Koneksi gagal. Coba lagi.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooks();
    }, []);

    const handleRefresh = () => {
        fetchBooks();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loading />
            </div>
        );
    }

    return <BookInventory books={books} onRefresh={handleRefresh} />;
}
