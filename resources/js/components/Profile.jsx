import { useState, useEffect } from "react";
import ProfileHeader from "@/components/ui/profile/ProfileHeader";
import ProfileActions from "@/components/ui/profile/ProfileActions";
import EditProfileModal from "@/components/ui/profile/EditProfileModal";
import NavbarHome from "./ui/NavbarHome";
import Loading2 from "./ui/Loading2";

export default function Profile() {
    document.title = "Profile - Lobaca";
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);

                const token = localStorage.getItem("user_token");
                if (!token) {
                    throw new Error("No authentication token found");
                }

                const response = await fetch("/api/profile", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        localStorage.removeItem("user_token");
                        throw new Error(
                            "Session expired. Please log in again."
                        );
                    }
                    throw new Error("Failed to fetch profile");
                }

                const data = await response.json();
                setUserProfile({
                    ...data,
                    memberSince: new Date(),
                });
            } catch (err) {
                setError(err.message);
                console.error("Error fetching profile:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleEditProfile = (updatedProfile) => {
        setUserProfile(updatedProfile);
        setIsEditModalOpen(false);
    };

    const handleLogout = () => {
        console.log("Logging out...");
    };

    if (loading) {
        return (
            <>
                <NavbarHome />
                <main className="min-h-screen overflow-x-hidden bg-blue-900 flex items-center justify-center">
                    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
                        <Loading2 />
                    </div>
                </main>
            </>
        );
    }

    if (error) {
        return (
            <>
                <NavbarHome />
                <main className="min-h-screen overflow-x-hidden bg-blue-900 flex items-center justify-center">
                    <div className="text-white text-xl">Error: {error}</div>
                </main>
            </>
        );
    }

    return (
        <>
            <NavbarHome />
            <main className="min-h-screen overflow-x-hidden bg-blue-900">
                {/* Background header */}
                <div className="relative h-32 sm:h-40 md:h-48 bg-[#E7B807] w-full">
                    <div className="absolute inset-0 opacity-20">
                        <div
                            className="absolute top-0 left-0 w-full h-full"
                            style={{
                                backgroundImage:
                                    "linear-gradient(45deg, rgba(0,0,0,.1) 25%, transparent 25%, transparent 75%, rgba(0,0,0,.1) 75%, rgba(0,0,0,.1)), linear-gradient(45deg, rgba(0,0,0,.1) 25%, transparent 25%, transparent 75%, rgba(0,0,0,.1) 75%, rgba(0,0,0,.1))",
                                backgroundSize: "40px 40px",
                                backgroundPosition: "0 0, 20px 20px",
                            }}
                        />
                    </div>
                </div>

                {/* Background pattern */}
                <div className="fixed inset-0 opacity-10 pointer-events-none z-0">
                    <div
                        className="absolute top-0 left-0 w-full h-full"
                        style={{
                            backgroundImage:
                                "linear-gradient(45deg, rgba(255,255,255,.1) 25%, transparent 25%, transparent 75%, rgba(255,255,255,.1) 75%, rgba(255,255,255,.1)), linear-gradient(45deg, rgba(255,255,255,.1) 25%, transparent 25%, transparent 75%, rgba(255,255,255,.1) 75%, rgba(255,255,255,.1))",
                            backgroundSize: "60px 60px",
                            backgroundPosition: "0 0, 30px 30px",
                        }}
                    />
                </div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-6 -mt-16 sm:-mt-20 md:-mt-24 relative z-10 pb-8">
                    {/* Header Profil */}
                    {userProfile && <ProfileHeader profile={userProfile} />}

                    {/* Menu Aksi */}
                    <ProfileActions
                        onEditProfile={() => setIsEditModalOpen(true)}
                        onLogout={handleLogout}
                    />
                </div>

                {/* Modal Edit Profil */}
                {userProfile && (
                    <EditProfileModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        onSave={handleEditProfile}
                        currentProfile={userProfile}
                    />
                )}
            </main>
        </>
    );
}
