import NavbarHome from "./ui/NavbarHome";
import AnimatedWave2 from "./ui/AnimatedWave2";
import Footer from "./ui/Footer";
import DaftarBukuAll from "./ui/DaftarBukuAll";

export default function Buku() {
    document.title = "Buku - Lobaca";
    return (
        <>
            <main>
                <NavbarHome />
                <div className="bg-linear-to-b from-[#1A1F71] to-violet-700">
                    <AnimatedWave2 />
                </div>
                <div className="bg-linear-to-b from-[#E7B807] via-violet-700 to-[#1A1F71]">
                    <DaftarBukuAll />
                    <Footer />
                </div>
            </main>
        </>
    );
}