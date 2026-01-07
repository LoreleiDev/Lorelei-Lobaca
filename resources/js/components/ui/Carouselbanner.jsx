import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function BannerCarousel() {
    const [banners, setBanners] = useState([]);
    const [current, setCurrent] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchActivePromos = async () => {
            try {
                const res = await fetch('/api/promos/active');
                if (res.ok) {
                    const data = await res.json();
                    const promoBanners = data.map(promo => ({
                        id: promo.id,
                        image: promo.imageUrl,
                        name: promo.name,
                        books: promo.books
                    }));
                    setBanners(promoBanners);
                }
            } catch (error) {
                // Silent error handling
            }
        };

        fetchActivePromos();
    }, []);

    useEffect(() => {
        if (banners.length === 0 || !isPlaying) return;
        const interval = setInterval(() => {
            setCurrent(prev => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [isPlaying, banners.length]);

    const handleBannerClick = (id) => {
        const banner = banners.find(b => b.id === id);
        if (!banner) return;

        const hasBooks = Array.isArray(banner.books) && banner.books.length > 0;
        const link = hasBooks ? `/promo/${id}` : `/promo`;
        navigate(link);
    };

    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    const handleTouchStart = (e) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!banners.length) return;
        if (touchStart - touchEnd > 50) {
            setCurrent(prev => (prev + 1) % banners.length);
        } else if (touchStart - touchEnd < -50) {
            setCurrent(prev => (prev - 1 + banners.length) % banners.length);
        }
    };

    if (banners.length === 0) {
        return null;
    }

    return (
        <div className="relative w-full overflow-hidden py-6">
            <div className="px-4 mx-auto">
                <div
                    className="relative w-full bg-white rounded-2xl overflow-hidden shadow-lg mx-auto"
                    style={{ aspectRatio: '2030 / 350', maxWidth: '2030px' }}
                    onMouseEnter={() => setIsPlaying(false)}
                    onMouseLeave={() => setIsPlaying(true)}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {banners.length > 0 && (
                        <div className="absolute inset-0">
                            <div
                                className="absolute inset-0 cursor-pointer"
                                onClick={() => handleBannerClick(banners[current].id)}
                            >
                                <img
                                    src={banners[current].image}
                                    alt={banners[current].name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                                <div className="absolute inset-0 bg-black/20" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-black/50 text-white px-4 py-2 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                                        Klik untuk detail
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {banners.length > 1 && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 flex gap-2 sm:gap-3">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrent(index)}
                                className={`transition-all duration-300 cursor-pointer rounded-full ${index === current
                                    ? "bg-yellow-600 w-8 sm:w-10 h-2 sm:h-2.5"
                                    : "bg-yellow-300 hover:bg-yellow-400 w-2 sm:w-2.5 h-2 sm:h-2.5"
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}