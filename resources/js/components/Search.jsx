import Footer from "./ui/Footer";
import SearchResults from "./ui/SearchResult";
import { CartProvider } from '../hooks/UseCart';

export default function Search() {
    document.title = "Buku - Lobaca";
    return (
        <CartProvider>
            <>
                <main>
                    <div className="min-h-screen bg-linear-to-br from-[#e2e9fd] via-[#fef9f3] to-[#d2ddfb] bg-size-[200%_200%] animate-[gradient-pulse_8s_ease-in-out_infinite]">
                        <SearchResults />
                        <Footer />
                    </div>
                </main>
            </>
        </CartProvider>
    );
}