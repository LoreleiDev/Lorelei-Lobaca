import { useState, useEffect } from 'react';
import BukuPromo from "./ui/BukuPromo";
import BannerCarousel from "./ui/Carouselbanner";
import DaftarBuku from "./ui/DaftarBuku";
import Testimoni from "./ui/Testimoni";
import Footer from "./ui/Footer";
import Loading from "./ui/Loading";

export default function Home() {
    const [hasBooks, setHasBooks] = useState(true); 
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = "Home - Lobaca";
        
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
                <Loading />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-linear-to-br from-[#e2e9fd] via-[#fef9f3] to-[#d2ddfb] bg-size-[200%_200%] animate-[gradient-pulse_8s_ease-in-out_infinite]">
            <main className="grow w-full">
                <BannerCarousel />

                {hasBooks ? (
                    <>
                        <BukuPromo />
                        <DaftarBuku />
                        <Testimoni />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
                        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/50 max-w-md w-full">
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-20 w-20 mx-auto text-gray-400 mb-4" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                Belum Ada Buku Tersedia
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Maaf, saat ini koleksi buku kami sedang dalam proses pembaruan. Silakan kembali lagi nanti untuk melihat koleksi terbaru kami.
                            </p>
                            
                            <button 
                                onClick={() => window.location.reload()}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md"
                            >
                                Muat Ulang Halaman
                            </button>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}