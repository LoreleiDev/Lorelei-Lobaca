import React, { useState, useEffect, useCallback } from "react";

export default function Testimoni() {
    const [testimonials, setTestimonials] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                const res = await fetch("/api/testimonials/public");
                if (res.ok) {
                    const data = await res.json();
                    setTestimonials(data.testimonials || []);
                } else {
                    console.error("Gagal mengambil testimoni:", res.status);
                }
            } catch (error) {
                console.error("Kesalahan jaringan:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTestimonials();
    }, []);

    const nextTestimonial = useCallback(() => {
        setCurrentIndex(prev =>
            prev === testimonials.length - 1 ? 0 : prev + 1
        );
    }, [testimonials.length]);

    const prevTestimonial = useCallback(() => {
        setCurrentIndex(prev =>
            prev === 0 ? testimonials.length - 1 : prev - 1
        );
    }, [testimonials.length]);

    const goToSlide = (index) => {
        setCurrentIndex(index);
    };

    useEffect(() => {
        if (testimonials.length <= 1) return;

        const interval = setInterval(() => {
            nextTestimonial();
        }, 5000);

        return () => clearInterval(interval);
    }, [testimonials.length, nextTestimonial]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-white">Memuat testimoni...</p>
            </div>
        );
    }

    if (testimonials.length === 0) {
        return null;
    }

    const currentTestimonial = testimonials[currentIndex];

    return (
        <>
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h1
                    className="select-none text-center text-xl sm:text-2xl md:text-3xl mb-6 md:mb-10 text-gray-200"
                    style={{ fontFamily: "Rubik Mono One" }}
                >
                    TESTIMONI
                </h1>

                <div className="max-w-2xl w-full">
                    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                        <div className="text-center relative">
                            {/* Avatar */}
                            <div className="flex justify-center mb-4">
                                <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden border-2 border-gray-300">
                                    {currentTestimonial.user?.avatar ? (
                                        <img
                                            src={currentTestimonial.user.avatar}
                                            alt={`${currentTestimonial.user.first_name || ''} ${currentTestimonial.user.last_name || ''}`.trim() || "User"}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-gray-600 text-lg flex items-center justify-center h-full">👤</span>
                                    )}
                                </div>
                            </div>

                            {/* Quote */}
                            <p className="text-lg md:text-xl font-bold text-gray-800 mb-6 leading-relaxed px-2 relative">
                                <span className="absolute -top-2 -left-1 text-4xl text-blue-400 opacity-30">"</span>
                                {currentTestimonial.comment || currentTestimonial.quote}
                                <span className="absolute -bottom-4 -right-1 text-4xl text-blue-400 opacity-30">"</span>
                            </p>

                            <div className="mt-6">
                                <div className="w-12 h-0.5 bg-blue-500 mx-auto mb-3"></div>
                                <p className="text-base text-gray-600 italic">
                                    ~ {currentTestimonial.user
                                        ? `${currentTestimonial.user.first_name || ''} ${currentTestimonial.user.last_name || ''}`.trim() || "Anonim"
                                        : "Anonim"}
                                </p>
                            </div>
                        </div>

                        {/* Navigation Controls */}
                        <div className="flex justify-between items-center mt-6">
                            <button
                                onClick={prevTestimonial}
                                className="cursor-pointer p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors duration-200"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 19l-7-7 7-7"
                                    />
                                </svg>
                            </button>

                            {/* Dots Indicator */}
                            <div className="flex space-x-1">
                                {testimonials.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => goToSlide(index)}
                                        className={`cursor-pointer w-2 h-2 rounded-full transition-all duration-300 ${
                                            index === currentIndex
                                                ? "bg-blue-600 scale-125"
                                                : "bg-blue-300 hover:bg-blue-400"
                                        }`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={nextTestimonial}
                                className="cursor-pointer p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors duration-200"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}