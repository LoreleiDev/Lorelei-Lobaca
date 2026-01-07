export default function ProfileHeader({ profile }) {

    return (
        <div className="flex flex-col items-center mb-12 -mt-20 relative z-20">
            <div className="relative mb-8">
                <div className="absolute -inset-2 bg-yellow-400 -rotate-3 rounded-full" />
                <div className="absolute -inset-1 bg-zinc-900 rotate-2 rounded-full" />

                <div className="relative w-40 h-40 md:w-48 md:h-48 bg-zinc-900 border-4 border-yellow-400 rounded-full overflow-hidden">
                    <img
                        src={profile.avatar || "/placeholder.svg"}
                        alt={profile.name}
                        className="object-cover w-full h-full"
                    />
                </div>
            </div>

            <div className="text-center space-y-2 relative z-10">
                <h1
                    className="text-4xl md:text-5xl font-black text-yellow-400 drop-shadow-lg"
                    style={{ textShadow: "3px 3px 0px rgba(0,0,0,0.8)" }}
                >
                    {profile.name}
                </h1>
                
                {/* Email dan Phone */}
                <div className="flex flex-col md:flex-row gap-4 md:gap-8 justify-center items-center text-zinc-300">
                    {profile.email && (
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm md:text-base">{profile.email}</span>
                        </div>
                    )}
                    
                    {profile.phone && (
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="text-sm md:text-base">{profile.phone}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}