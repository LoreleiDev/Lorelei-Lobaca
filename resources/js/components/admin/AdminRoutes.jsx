import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Loading from "../../components/ui/Loading";

export default function AdminRoute() {
    const [isAuth, setIsAuth] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const verifySession = async () => {
            
            const token = localStorage.getItem("admin_token");
            if (!token) {
                setIsAuth(false);
                return;
            }

            try {
                const res = await fetch("/api/admin/me", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                });
                console.log("Response status:", res.status);

                if (res.ok) {
                    setIsAuth(true);
                } else {
                    localStorage.removeItem("admin_token");
                    setIsAuth(false);
                }
            } catch {
                localStorage.removeItem("admin_token");
                setIsAuth(false);
            }
        };

        verifySession();
    }, [location.pathname]);

    if (isAuth === null) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loading />
            </div>
        );
    }

    return isAuth ? <Outlet /> : <Navigate to="/admin/login" replace />;
}
