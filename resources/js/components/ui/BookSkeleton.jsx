import { useEffect, useState } from "react";

export default function BookSkeleton() {
    const [skeletonCount, setSkeletonCount] = useState(5);

    useEffect(() => {

        const style = document.createElement('style');
        style.textContent = `
            @keyframes shimmer {
                0% {
                    background-position: -200% 0;
                }
                100% {
                    background-position: 200% 0;
                }
            }
        `;
        document.head.appendChild(style);


        const updateSkeletonCount = () => {
            const width = window.innerWidth;
            if (width >= 1024) {
                setSkeletonCount(5);
            } else if (width >= 768) {
                setSkeletonCount(4);
            } else if (width >= 640) {
                setSkeletonCount(3);
            } else {
                setSkeletonCount(2);
            }
        };

        updateSkeletonCount();
        window.addEventListener('resize', updateSkeletonCount);

        return () => {
            document.head.removeChild(style);
            window.removeEventListener('resize', updateSkeletonCount);
        };
    }, []);

    const shimmerStyle = {
        background: 'linear-gradient(90deg, #f0f0f0 0%, #f8f8f8 20%, #f0f0f0 40%, #f0f0f0 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.2s ease-in-out infinite',
    };

    return (
        <div className="group relative bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
            <div className="w-full pt-[120%] relative overflow-hidden bg-gray-100">
                <div
                    className="absolute top-0 left-0 w-full h-full"
                    style={shimmerStyle}
                ></div>
            </div>

            <div className="p-2 flex-1 flex flex-col">
                <div className="flex-1 space-y-1.5 mb-2">
                    <div
                        className="h-3 sm:h-3.5 rounded w-4/5"
                        style={shimmerStyle}
                    ></div>
                    <div
                        className="h-3 sm:h-3.5 rounded w-3/4"
                        style={shimmerStyle}
                    ></div>
                    <div
                        className="h-2.5 rounded w-3/5"
                        style={shimmerStyle}
                    ></div>
                </div>

                <div className="flex items-center justify-between mt-1">
                    <div className="flex flex-col space-y-1">
                        <div
                            className="h-3 sm:h-3.5 rounded w-12 sm:w-16"
                            style={shimmerStyle}
                        ></div>
                        <div
                            className="h-2.5 rounded w-10 sm:w-12"
                            style={shimmerStyle}
                        ></div>
                    </div>
                    <div
                        className="h-5 w-10 sm:w-12 rounded-full"
                        style={shimmerStyle}
                    ></div>
                </div>
            </div>
        </div>
    );
}

export function getSkeletonCount() {
    if (typeof window === 'undefined') return 5;

    const width = window.innerWidth;
    if (width >= 1024) return 5;
    if (width >= 768) return 4;
    if (width >= 640) return 3;
    return 2;
}