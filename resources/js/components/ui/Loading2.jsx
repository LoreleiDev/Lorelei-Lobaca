import React from "react";

export default function Loading2() {
    const bounceStyle = {
        animation: 'bounce-custom 1s infinite',
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-6">
            <style>
                {`
                @keyframes bounce-custom {
                    0%, 100% {
                        transform: translateY(0);
                        opacity: 0.6;
                    }
                    50% {
                        transform: translateY(-20px);
                        opacity: 1;
                    }
                }
                `}
            </style>
            
            <div className="flex items-center justify-center gap-1">
                {["L", "o", "a", "d", "i", "n", "g"].map((letter, i) => (
                    <span
                        key={i}
                        className="text-4xl font-bold text-gray-300"
                        style={{
                            ...bounceStyle,
                            animationDelay: `${i * 0.1}s`,
                        }}
                    >
                        {letter}
                    </span>
                ))}
            </div>

            <p className="text-gray-100 font-medium text-lg">
                Please be patient...
            </p>
        </div>
    );
}