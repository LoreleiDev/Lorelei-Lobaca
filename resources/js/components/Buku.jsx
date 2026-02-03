import Footer from "./ui/Footer";
import DaftarBukuAll from "./ui/DaftarBukuAll";

export default function Buku() {
    document.title = "Buku - Lobaca";
    return (
        <>
            <main>
                <div className="bg-[#f8f5f0]">
                    <DaftarBukuAll />
                    <Footer />
                </div>
            </main>
        </>
    );
}