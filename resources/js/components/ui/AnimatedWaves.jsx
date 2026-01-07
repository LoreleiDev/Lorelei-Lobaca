// src/components/ui/AnimatedWaves.js
export default function AnimatedWaves() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            <svg
                className="absolute bottom-0 left-0 w-full h-full"
                viewBox="0 0 1200 120"
                preserveAspectRatio="xMidYMid slice"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="wave-gradient-1" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
                    </linearGradient>
                    <linearGradient id="wave-gradient-2" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
                    </linearGradient>
                    <linearGradient id="wave-gradient-3" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
                    </linearGradient>
                </defs>
                <g className="wave wave-1">
                    <path d="M0,50 Q150,35 300,50 T600,50 T900,50 T1200,50 L1200,120 L0,120 Z" fill="url(#wave-gradient-1)" />
                    <path d="M1200,50 Q1350,35 1500,50 T1800,50 T2100,50 T2400,50 L2400,120 L1200,120 Z" fill="url(#wave-gradient-1)" />
                </g>
                <g className="wave wave-2">
                    <path d="M0,65 Q150,45 300,65 T600,65 T900,65 T1200,65 L1200,120 L0,120 Z" fill="url(#wave-gradient-2)" />
                    <path d="M1200,65 Q1350,45 1500,65 T1800,65 T2100,65 T2400,65 L2400,120 L1200,120 Z" fill="url(#wave-gradient-2)" />
                </g>
                <g className="wave wave-3">
                    <path d="M0,80 Q150,60 300,80 T600,80 T900,80 T1200,80 L1200,120 L0,120 Z" fill="url(#wave-gradient-3)" />
                    <path d="M1200,80 Q1350,60 1500,80 T1800,80 T2100,80 T2400,80 L2400,120 L1200,120 Z" fill="url(#wave-gradient-3)" />
                </g>
            </svg>
            <style>{`
                @keyframes wave-animation-1 {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-1200px); }
                }
                @keyframes wave-animation-2 {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-1200px); }
                }
                @keyframes wave-animation-3 {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-1200px); }
                }
                .wave-1 { animation: wave-animation-1 25s linear infinite; }
                .wave-2 { animation: wave-animation-2 18s linear infinite; }
                .wave-3 { animation: wave-animation-3 12s linear infinite; }
            `}</style>
        </div>
    );
}