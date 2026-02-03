import Footer from "./ui/Footer";
import DaftarBukuAll from "./ui/DaftarBukuAll";

export default function Buku() {
    document.title = "Buku - Lobaca";
    return (
        <>
            <main>
                <div className="bg-linear-to-b from-[#E7B807] via-violet-700 to-[#1A1F71]">
                    <DaftarBukuAll />
                    <Footer />
                </div>
            </main>
        </>
    );
}