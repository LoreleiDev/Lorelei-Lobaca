import { useState, useEffect } from 'react';
import BukuPromo from "./ui/BukuPromo";
import BannerCarousel from "./ui/Carouselbanner";
import DaftarBuku from "./ui/DaftarBuku";
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
                <div className="bg-[#f8f5f0]">
                    <BannerCarousel />
                    <BukuPromo />
                    <DaftarBuku />
                    <Testimoni />
                    <Footer />
                </div>
            </main>
        </>
    );
}
