import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
    document.title = "404";
    const [staticEffect, setStaticEffect] = useState(false);
    const [isButtonHovered, setIsButtonHovered] = useState(false);
    const navigate = useNavigate(); 

    useEffect(() => {
        const staticInterval = setInterval(() => {
            setStaticEffect(true);
            setTimeout(() => setStaticEffect(false), 100);
        }, 3000);

        return () => clearInterval(staticInterval);
    }, []);

    const handleReturnHome = () => {
        navigate(-1); 
    };

    return (
        <div className="relative w-full h-screen flex justify-center items-center bg-black font-sans overflow-hidden select-none">
            <style>
                {`
                @keyframes staticAnim {
                    0% { opacity: 0.3; }
                    50% { opacity: 0.6; }
                    100% { opacity: 0.3; }
                }
                @keyframes scanAnim {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
                @keyframes glitchAnim {
                    0% { 
                        transform: translate(0); 
                        text-shadow: 2px 0 0 #ff0066, -2px 0 0 #00ffff;
                    }
                    2% { 
                        transform: translate(-2px, 1px); 
                        text-shadow: 2px 0 0 #ff0066, -2px 0 0 #00ffff;
                    }
                    4% { 
                        transform: translate(2px, -1px); 
                        text-shadow: -2px 0 0 #ff0066, 2px 0 0 #00ffff;
                    }
                    6% { 
                        transform: translate(0); 
                        text-shadow: 2px 0 0 #ff0066, -2px 0 0 #00ffff;
                    }
                    100% { 
                        transform: translate(0); 
                        text-shadow: 2px 0 0 #ff0066, -2px 0 0 #00ffff;
                    }
                }
                @keyframes flickerAnim {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.8; }
                    51% { opacity: 0.2; }
                    52% { opacity: 0.8; }
                }
                .static-overlay {
                    animation: staticAnim 0.1s infinite;
                }
                .scan-line {
                    animation: scanAnim 3s linear infinite;
                }
                .glitch-text {
                    animation: glitchAnim 3s infinite;
                }
                .flicker-text {
                    animation: flickerAnim 2s infinite;
                }
            `}
            </style>

            <div
                className="static-overlay absolute top-0 left-0 w-full h-full 
                bg-repeating-linear-gradient opacity-40 pointer-events-none"
                style={{
                    backgroundImage: `repeating-linear-gradient(
                        0deg,
                        rgba(255, 255, 255, 0.05) 0px,
                        rgba(255, 255, 255, 0.05) 1px,
                        transparent 1px,
                        transparent 2px
                    )`,
                }}
            ></div>

            <div className="scan-line absolute top-0 left-0 w-full h-1 
                bg-linear-to-b from-transparent via-yellow-400 to-transparent opacity-30"></div>

            <div className="relative w-full max-w-4xl px-4 text-center z-10">
                <div
                    className={`w-full h-full flex flex-col justify-center items-center p-5 
                    transition-all duration-100 relative
                    ${
                        staticEffect
                            ? "bg-gradient-radial from-gray-800 to-black"
                            : ""
                    }`}
                >
                    <div
                        className="glitch-text font-press-start text-6xl sm:text-7xl md:text-8xl lg:text-9xl 
                        font-bold text-yellow-400 mb-6 sm:mb-8 tracking-wider
                        drop-shadow-[0_0_15px_rgba(255,204,0,0.8)]"
                    >
                        404
                    </div>

                    <div
                        className="flicker-text text-white text-xl sm:text-2xl md:text-3xl uppercase tracking-widest 
                        mb-6 sm:mb-8 font-sans font-bold"
                    >
                        PAGE NOT FOUND
                    </div>

                    <div
                        className="text-yellow-400 text-base sm:text-lg md:text-xl tracking-wide 
                        mb-6 sm:mb-8 max-w-xs sm:max-w-md md:max-w-lg leading-relaxed font-sans text-center
                        drop-shadow-[0_0_5px_rgba(255,204,0,0.5)]"
                    >
                        The page you're looking for doesn't exist.
                        <br />
                        It might have been moved or deleted.
                    </div>

                    <button
                        className={`inline-block px-8 sm:px-10 py-4 bg-yellow-400 text-black font-bold uppercase 
                            tracking-widest transition-all duration-300 mt-4 cursor-pointer 
                            border-none rounded-sm shadow-[0_0_20px_rgba(255,204,0,0.5)] relative text-lg
                            hover:bg-yellow-300 hover:shadow-[0_0_25px_rgba(255,204,0,0.7)] hover:scale-105
                            ${
                                isButtonHovered
                                    ? "bg-yellow-300 shadow-[0_0_25px_rgba(255,204,0,0.7)] scale-105"
                                    : ""
                            }`}
                        onClick={handleReturnHome}
                        onMouseEnter={() => setIsButtonHovered(true)}
                        onMouseLeave={() => setIsButtonHovered(false)}
                    >
                        RETURN TO HOME
                    </button>
                </div>
            </div>

            <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                    background: `radial-gradient(circle at 20% 50%, rgba(255, 204, 0, 0.1) 0%, transparent 50%),
                                radial-gradient(circle at 80% 20%, rgba(255, 204, 0, 0.1) 0%, transparent 50%),
                                radial-gradient(circle at 40% 80%, rgba(255, 204, 0, 0.1) 0%, transparent 50%)`,
                }}
            ></div>
        </div>
    );
}