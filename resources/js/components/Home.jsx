import { useState, useEffect } from 'react';
import AnimatedWave from "./ui/AnimatedWave";
import BukuPromo from "./ui/BukuPromo";
import BannerCarousel from "./ui/Carouselbanner";
import DaftarBuku from "./ui/DaftarBuku";
import NavbarHome from "./ui/NavbarHome";
import Testimoni from "./ui/Testimoni";
import Footer from "./ui/Footer";
import Loading from "./ui/Loading";

export default function Home() {
    document.title = "Home - Lobaca";
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const timer = setTimeout(() => {
            setLoading(false);
        }, 1500);


        return () => clearTimeout(timer);
    }, []);


    useEffect(() => {
        document.title = "Home - Lobaca";
    }, []);

    if (loading) {
        return (
            <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
                <Loading />
            </div>
        );
    }

    return (
        <>
            <main>
                <NavbarHome />
                <div className="bg-linear-to-b from-[#1A1F71] to-violet-700">
                    <BannerCarousel />
                    <AnimatedWave />
                </div>
                <div className="bg-linear-to-b from-[#E7B807] via-violet-700 to-[#1A1F71]">

                    <BukuPromo />
                    <DaftarBuku />
                    <Testimoni />
                    <Footer />
                </div>
            </main>
        </>
    );
}
