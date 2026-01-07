import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Loading from "@/components/ui/Loading";

export default function UserRoute() {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    const publicRoutes = ["/login", "/register", "/password/forgot"];

    useEffect(() => {
        const token = localStorage.getItem("user_token");

        if (token && publicRoutes.includes(location.pathname)) {
            navigate("/");
            return;
        }

        if (!token) {
            setIsAuthenticated(false);
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch("/api/profile", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                });
                if (res.ok) {
                    setIsAuthenticated(true);
                } else {
                    localStorage.removeItem("user_token");
                    setIsAuthenticated(false);
                }
            } catch {
                localStorage.removeItem("user_token");
                setIsAuthenticated(false);
            }
        };

        verify();
    }, [location.pathname, navigate]);

    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loading />
            </div>
        );
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
