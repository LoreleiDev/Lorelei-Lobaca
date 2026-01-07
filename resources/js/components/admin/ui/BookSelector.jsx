import { useState, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

export function BookSelector({ onSelectBooks, onClose, selectedBookIds = [] }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activePromoBookIds, setActivePromoBookIds] = useState([]);
    const [selectedBooks, setSelectedBooks] = useState(new Set());

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("admin_token");

            // Ambil buku yang sedang aktif di promo
            const promoRes = await fetch("/api/admin/promos", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (promoRes.ok) {
                const promos = await promoRes.json();
                const now = new Date();
                const activeBookIds = promos.flatMap((promo) => {
                    const endDate = new Date(`${promo.endDate}T${promo.endTime}`);
                    return endDate > now ? promo.books.map(b => b.id) : [];
                });
                setActivePromoBookIds(activeBookIds);
            }

            // Ambil semua buku
            const bookRes = await fetch("/api/admin/books", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (bookRes.ok) {
                const data = await bookRes.json();
                setBooks(data);
            }

            setLoading(false);
        };

        fetchData();
    }, []);

    const filteredBooks = useMemo(() => {
        return books.filter(
            (book) =>
                book.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
                book.penulis.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (book.isbn && book.isbn.includes(searchQuery))
        );
    }, [books, searchQuery]);

    const toggleBook = (bookId) => {
        setSelectedBooks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(bookId)) {
                newSet.delete(bookId);
            } else {
                newSet.add(bookId);
            }
            return newSet;
        });
    };

    const handleConfirm = () => {
        const booksToAdd = books.filter(book => selectedBooks.has(book.buku_id));
        onSelectBooks(booksToAdd.map(book => ({
            id: book.buku_id,
            title: book.judul,
            author: book.penulis,
            discount: 10, 
        })));
        onClose();
    };

    return (
        <div className="flex flex-col h-full">
            <div className="space-y-2 pb-3 shrink-0">
                <Label htmlFor="book-search" className="text-sm font-medium">
                    Cari Buku
                </Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        id="book-search"
                        placeholder="Cari judul, penulis, atau ISBN..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 text-sm"
                    />
                </div>
                <div className="text-xs text-muted-foreground">
                    {selectedBooks.size} buku dipilih
                </div>
            </div>

            <div className="border rounded-lg flex-1 min-h-0 overflow-y-auto">
                {loading ? (
                    <div className="p-6 text-center text-sm">Loading...</div>
                ) : filteredBooks.length === 0 ? (
                    <div className="p-6 text-center">
                        <p className="text-muted-foreground text-sm">
                            Buku tidak ditemukan
                        </p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {filteredBooks.map((book) => {
                            const isDisabled = activePromoBookIds.includes(book.buku_id) || selectedBookIds.includes(book.buku_id);
                            const isChecked = selectedBooks.has(book.buku_id);
                            return (
                                <label
                                    key={book.buku_id}
                                    className={`w-full p-3 flex items-start gap-3 cursor-pointer ${isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-secondary/50"
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => toggleBook(book.buku_id)}
                                        disabled={isDisabled}
                                        className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">
                                            {book.judul}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {book.penulis}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            ISBN: {book.isbn}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs font-medium whitespace-nowrap">
                                            Stok: {book.stok}
                                        </p>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="flex flex-col-reverse xs:flex-row justify-end gap-2 pt-3 shrink-0">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="w-full xs:w-auto text-xs h-9 cursor-pointer"
                >
                    Batal
                </Button>
                <Button
                    type="button"
                    onClick={handleConfirm}
                    disabled={selectedBooks.size === 0}
                    className="w-full xs:w-auto text-xs h-9 cursor-pointer"
                >
                    Tambahkan {selectedBooks.size} Buku
                </Button>
            </div>
        </div>
    );
}