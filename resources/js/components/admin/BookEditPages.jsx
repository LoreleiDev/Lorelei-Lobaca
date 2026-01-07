import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BookEditForm from "./BookEdit";
import Loading from "../ui/Loading";
import Swal from "sweetalert2";

export default function BookEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBook = async () => {
            const token = localStorage.getItem("admin_token");
            if (!token) {
                Swal.fire(
                    "Error",
                    "Sesi admin tidak valid. Silakan login.",
                    "error"
                );
                navigate("/login");
                return;
            }

            try {
                const res = await fetch(`/api/admin/books/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                });

                if (res.ok) {
                    const data = await res.json();
                    setBook(data);
                } else {
                    Swal.fire("Error", "Buku tidak ditemukan.", "error");
                    navigate("/admin/inventory");
                }
            } catch (error) {
                console.error("Fetch book error:", error);
                Swal.fire("Error", "Gagal memuat data buku.", "error");
                navigate("/admin/inventory");
            } finally {
                setLoading(false);
            }
        };

        fetchBook();
    }, [id, navigate]);

    const handleSuccess = () => {
        Swal.fire("Berhasil", "Buku berhasil diperbarui.", "success");
        navigate("/admin/inventory");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loading />
            </div>
        );
    }

    if (!book) {
        return (
            <div className="p-6 text-center text-muted-foreground">
                Data buku tidak tersedia.
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground mb-6">
                Edit Buku: {book.judul}
            </h1>
            <BookEditForm initialBook={book} onSuccess={handleSuccess} />
        </div>
    );
}
