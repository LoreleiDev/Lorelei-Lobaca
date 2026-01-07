import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Upload,
    Package,
    ShoppingCart,
    Settings,
    LogOut,
    BookOpen,
    User,
    Menu,
    BookText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";
import logo from "../../../assets/logo.webp";

const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
    { icon: Upload, label: "Upload Produk", href: "/admin/upload" },
    { icon: Package, label: "Inventory", href: "/admin/inventory" },
    { icon: Package, label: "Promo", href: "/admin/promo" },
    { icon: BookText, label: "Ulasan Pengguna", href: "/admin/ulasan" },
    { icon: ShoppingCart, label: "Pesanan", href: "/admin/orders" },
    { icon: Settings, label: "Pengaturan", href: "/admin/settings" },
];

export default function Sidebar({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [admin, setAdmin] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const fetchAdmin = async () => {
            const token = localStorage.getItem("admin_token");
            if (!token) {
                navigate("/admin/login");
                return;
            }

            try {
                const res = await fetch("/api/admin/me", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                });

                if (res.ok) {
                    const data = await res.json();
                    setAdmin(data.admin);
                } else {
                    localStorage.removeItem("admin_token");
                    navigate("/admin/login");
                }
            } catch (error) {
                localStorage.removeItem("admin_token");
                navigate("/admin/login");
            }
        };

        fetchAdmin();
    }, [navigate]);

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: "Yakin ingin logout?",
            text: "Anda akan keluar dari admin panel",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Ya, Logout!",
            cancelButtonText: "Batal",
            reverseButtons: true,
        });

        if (result.isConfirmed) {
            const token = localStorage.getItem("admin_token");
            if (token) {
                try {
                    await fetch("/api/admin/logout", {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/json",
                        },
                    });
                } catch (e) {
                    console.error("Logout API error:", e);
                }
            }
            localStorage.removeItem("admin_token");

            Swal.fire({
                title: "Logout Berhasil!",
                text: "Anda telah berhasil logout",
                icon: "success",
                showConfirmButton: true,
            }).then(() => {
                navigate("/admin/login");
            });
        }
    };

    const toggleSidebar = () => setSidebarOpen((prev) => !prev);

    return (
        <div className="flex h-screen bg-background ">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 z-50 h-screen transition-all duration-300 border-r border-border bg-sidebar ${
                    sidebarOpen ? "w-64" : "w-18"
                }`}
            >
                {/* Logo */}
                <div className="flex flex-col border-b border-border px-4 py-4">
                    <div className="mb-4">
                        {sidebarOpen ? (
                            <div className="flex items-center gap-2">
                                <div className="rounded-xl p-2">
                                    <img
                                        src={logo}
                                        alt="Logo"
                                        className="h-12 w-12 object-contain"
                                    />
                                </div>
                                <div>
                                    <p className="font-bold text-foreground">
                                        LOBACA
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Admin Panel
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="items-center ">
                                <div className="rounded-xl p-2">
                                    <BookOpen />
                                </div>
                            </div>
                        )}
                    </div>

                    {sidebarOpen && admin && (
                        <div className="flex items-center gap-3 py-2 bg-sidebar-accent/20 rounded px-2">
                            <div className="rounded-full bg-primary/20 p-1">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">
                                    {admin.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {admin.email}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Nav items */}
                <nav className="flex-1 space-y-1 px-3 py-6">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <NavLink
                                key={item.href}
                                to={item.href}
                                onClick={() => {
                                    if (window.innerWidth < 1024)
                                        setSidebarOpen(false);
                                }}
                            >
                                <Button
                                    variant={isActive ? "default" : "ghost"}
                                    className={`cursor-pointer w-full justify-start gap-3 rounded-lg ${
                                        isActive
                                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                            : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/10"
                                    } ${
                                        !sidebarOpen ? "px-3 py-6" : "px-4 py-6"
                                    }`}
                                >
                                    <item.icon
                                        className={`h-5 w-5 shrink-0 ${
                                            !sidebarOpen ? "mx-auto" : ""
                                        }`}
                                    />
                                    {sidebarOpen && (
                                        <span className="truncate">
                                            {item.label}
                                        </span>
                                    )}
                                </Button>
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="border-t border-border px-3 py-4">
                    <Button
                        variant="ghost"
                        className={`cursor-pointer w-full justify-start gap-3 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 ${
                            !sidebarOpen ? "px-3 py-6" : "px-4 py-6"
                        }`}
                        onClick={handleLogout}
                    >
                        <LogOut
                            className={`h-5 w-5 ${
                                !sidebarOpen ? "mx-auto" : ""
                            }`}
                        />
                        {sidebarOpen && <span>Logout</span>}
                    </Button>
                </div>
            </aside>

            {/* Main content */}
            <div
                className={`flex-1 flex flex-col transition-all duration-300 ${
                    sidebarOpen ? "ml-64" : "ml-20"
                }`}
            >
                {/* Navbar */}
                <header className="border-b border-border bg-card px-4 py-4 lg:px-6 flex items-center justify-between ">
                    <div className="flex items-center gap-4">
                        {/* Tombol toggle sidebar */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="cursor-pointer text-muted-foreground hover:text-foreground"
                            onClick={toggleSidebar}
                            aria-label="Toggle sidebar"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        Lobaca Admin
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
