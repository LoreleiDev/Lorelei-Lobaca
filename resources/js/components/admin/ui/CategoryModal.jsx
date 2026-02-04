import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { X, Plus, Edit, Trash2 } from "lucide-react";
import Swal from "sweetalert2";

export default function CategoryManagerModal({ isOpen, onClose, onCategoriesUpdated }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [editingCategory, setEditingCategory] = useState(null);
    const [deletingIds, setDeletingIds] = useState(new Set());

    // Toast notification helper
    const showToast = (icon, title) => {
        Swal.fire({
            toast: true,
            position: "top-end",
            icon: icon,
            title: title,
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true,
            background: "#1e293b",
            color: "#f1f5f9",
        });
    };

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("admin_token");
            const res = await fetch("/api/admin/categories", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            } else {
                showToast("error", "Gagal memuat kategori");
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            showToast("error", "Gagal memuat kategori");
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) {
            showToast("warning", "Nama kategori wajib diisi");
            return;
        }

        try {
            const token = localStorage.getItem("admin_token");
            const res = await fetch("/api/admin/categories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                body: JSON.stringify({ name: newCategoryName }),
            });

            if (res.ok) {
                showToast("success", "Kategori berhasil ditambahkan");
                setNewCategoryName("");
                setIsAdding(false);
                fetchCategories();
                if (onCategoriesUpdated) onCategoriesUpdated();
            } else {
                const error = await res.json().catch(() => ({}));
                showToast("error", error.message || "Gagal menambah kategori");
            }
        } catch (error) {
            console.error("Error adding category:", error);
            showToast("error", "Terjadi kesalahan");
        }
    };

    const handleUpdateCategory = async () => {
        if (!editingCategory.name.trim()) {
            showToast("warning", "Nama kategori wajib diisi");
            return;
        }

        try {
            const token = localStorage.getItem("admin_token");
            const res = await fetch(`/api/admin/categories/${editingCategory.category_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                body: JSON.stringify({ name: editingCategory.name }),
            });

            if (res.ok) {
                showToast("success", "Kategori berhasil diupdate");
                setEditingCategory(null);
                fetchCategories();
                if (onCategoriesUpdated) onCategoriesUpdated();
            } else {
                const error = await res.json().catch(() => ({}));
                showToast("error", error.message || "Gagal mengupdate kategori");
            }
        } catch (error) {
            console.error("Error updating category:", error);
            showToast("error", "Terjadi kesalahan");
        }
    };

    const handleDeleteCategory = async (category) => {
        // Langsung hapus tanpa konfirmasi
        setDeletingIds(prev => new Set(prev).add(category.category_id));
        
        try {
            const token = localStorage.getItem("admin_token");
            const res = await fetch(`/api/admin/categories/${category.category_id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            if (res.ok) {
                showToast("success", "Kategori berhasil dihapus");
                // Update state lokal untuk menghilangkan kategori yang dihapus
                setCategories(prev => prev.filter(cat => cat.category_id !== category.category_id));
                if (onCategoriesUpdated) onCategoriesUpdated();
            } else {
                const error = await res.json().catch(() => ({}));
                showToast("error", error.message || "Gagal menghapus kategori");
            }
        } catch (error) {
            console.error("Error deleting category:", error);
            showToast("error", "Terjadi kesalahan");
        } finally {
            setDeletingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(category.category_id);
                return newSet;
            });
        }
    };

    // Versi alternatif: Hapus dengan SweetAlert sederhana (tanpa konfirmasi tombol)
    const handleDeleteCategoryAlternative = async (category) => {
        // Tampilkan loading toast
        const toast = Swal.fire({
            title: "Menghapus...",
            text: "Sedang menghapus kategori...",
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const token = localStorage.getItem("admin_token");
            const res = await fetch(`/api/admin/categories/${category.category_id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            await toast.close();

            if (res.ok) {
                showToast("success", "Kategori berhasil dihapus");
                setCategories(prev => prev.filter(cat => cat.category_id !== category.category_id));
                if (onCategoriesUpdated) onCategoriesUpdated();
            } else {
                const error = await res.json().catch(() => ({}));
                showToast("error", error.message || "Gagal menghapus kategori");
            }
        } catch (error) {
            await toast.close();
            console.error("Error deleting category:", error);
            showToast("error", "Terjadi kesalahan");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Kelola Kategori Buku</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Form Tambah Kategori */}
                    {isAdding ? (
                        <div className="border rounded-lg p-4 bg-muted/30">
                            <h4 className="font-semibold mb-3">Tambah Kategori Baru</h4>
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="new-category-name">Nama Kategori *</Label>
                                    <Input
                                        id="new-category-name"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="Contoh: Fiksi"
                                        className="mt-1"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setIsAdding(false);
                                            setNewCategoryName("");
                                        }}
                                    >
                                        Batal
                                    </Button>
                                    <Button onClick={handleAddCategory}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Tambah Kategori
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Button
                            onClick={() => setIsAdding(true)}
                            className="w-full"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Kategori Baru
                        </Button>
                    )}

                    {/* Form Edit Kategori */}
                    {editingCategory && (
                        <div className="border rounded-lg p-4 bg-muted/30">
                            <h4 className="font-semibold mb-3">Edit Kategori</h4>
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="edit-category-name">Nama Kategori *</Label>
                                    <Input
                                        id="edit-category-name"
                                        value={editingCategory.name}
                                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                        placeholder="Edit nama kategori"
                                        className="mt-1"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button
                                        variant="outline"
                                        onClick={() => setEditingCategory(null)}
                                    >
                                        Batal
                                    </Button>
                                    <Button onClick={handleUpdateCategory}>
                                        Simpan Perubahan
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Daftar Kategori */}
                    <div>
                        <h4 className="font-semibold mb-3">Daftar Kategori</h4>
                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Memuat kategori...
                            </div>
                        ) : categories.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Belum ada kategori. Tambahkan kategori baru!
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {categories.map((category) => (
                                    <div
                                        key={category.category_id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                                    >
                                        <span className="font-medium">{category.name}</span>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditingCategory(category)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteCategory(category)}
                                                disabled={deletingIds.has(category.category_id)}
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            >
                                                {deletingIds.has(category.category_id) ? (
                                                    <div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}