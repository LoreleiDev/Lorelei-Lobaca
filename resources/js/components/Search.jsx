import NavbarHome from "./ui/NavbarHome";
import Footer from "./ui/Footer";
import SearchResults from "./ui/SearchResult";

export default function Search() {
    document.title = "Buku - Lobaca";
    return (
        <>
            <main>
                <NavbarHome />
                <div className="bg-linear-to-b from-violet-700 to-[#1A1F71]">
                    <SearchResults />
                    <Footer />
                </div>
            </main>
        </>
    );
}