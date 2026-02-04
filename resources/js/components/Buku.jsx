import Footer from "./ui/Footer";
import DaftarBukuAll from "./ui/DaftarBukuAll";

export default function Buku() {
    document.title = "Buku - Lobaca";
    return (
        <>
            <main>
                <div className="min-h-screen bg-linear-to-br from-[#e2e9fd] via-[#fef9f3] to-[#d2ddfb] bg-size-[200%_200%] animate-[gradient-pulse_8s_ease-in-out_infinite]">
                    <DaftarBukuAll />
                    <Footer />
                </div>
            </main>
        </>
    );
}