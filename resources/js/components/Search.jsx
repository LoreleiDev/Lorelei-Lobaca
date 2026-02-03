import Footer from "./ui/Footer";
import SearchResults from "./ui/SearchResult";
import { CartProvider } from '../hooks/UseCart';

export default function Search() {
    document.title = "Buku - Lobaca";
    return (
        <CartProvider>
            <>
                <main>
                    <div className="bg-linear-to-b from-violet-700 to-[#1A1F71]">
                        <SearchResults />
                        <Footer />
                    </div>
                </main>
            </>
        </CartProvider>
    );
}