import "../css/app.css";
import "./bootstrap";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import NotFound from "./components/error/404";

import UserRoute from "./components/UserRoute";
import Register from "./components/Register";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import EditPassword from "./components/EditPassword";
import ChangeEmail from "./components/ChangeEmail";
import Home from "./components/Home";
import Profile from "./components/Profile";

import Buku from "./components/Buku";
import Search from "./components/Search";
import BukuDetail from "./components/BukuDetail";
import WishlistPage from "./components/Wishlist";
import PromoPage from "./components/Promo";
import PromoDetailPage from "./components/PromoDetail";
import KeranjangPage from "./components/Keranjang";
import PaymentSelector from "./components/ui/Pembayaran";
import AddressCourierSelector from "./components/ui/AlamatKurir";
import PaymentQris from "./components/PaymentQris";
import PaymentVa from "./components/PaymentVA";

import AdminLogin from "./components/admin/LoginAdmin";
import AdminDashboard from "./components/admin/Dashboard";
import AdminRoute from "./components/admin/AdminRoutes";
import AdminUpload from "./components/admin/Upload";
import AdminInventory from "./components/admin/InventoryPages";
import AdminEditInventory from "./components/admin/BookEditPages";
import AdminPromoSetting from "./components/admin/PromoSetting";
import AdminUlasanPage from "./components/admin/UlasanUser";

ReactDOM.createRoot(document.getElementById("app")).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                {/* === PUBLIC ROUTES === */}
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/password/forgot" element={<ForgotPassword />} />
                <Route path="*" element={<NotFound />} />

                <Route index element={<Home />} />
                <Route path="/buku" element={<Buku />} />
                <Route path="/search" element={<Search />} />
                <Route path="/buku/:id" element={<BukuDetail />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/promo" element={<PromoPage />} />
                <Route path="/promo/:id" element={<PromoDetailPage />} />
                <Route path="/cart" element={<KeranjangPage />} />
                <Route path="/payment" element={<PaymentSelector />} />
                <Route path="/alamat-kurir" element={<AddressCourierSelector />} />
                <Route path="/payment-qris" element={<PaymentQris />} />
                <Route path="/payment-va" element={<PaymentVa />} />

                {/* === USER PROTECTED ROUTES === */}
                <Route element={<UserRoute />}>
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/password/edit" element={<EditPassword />} />
                    <Route path="/email/edit" element={<ChangeEmail />} />
                </Route>

                {/* === ADMIN ROUTES === */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route element={<AdminRoute />}>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/upload" element={<AdminUpload />} />
                    <Route path="/admin/inventory" element={<AdminInventory />} />
                    <Route path="/admin/inventory/:id" element={<AdminEditInventory />} />
                    <Route path="/admin/promo" element={<AdminPromoSetting />} />
                    <Route path="/admin/ulasan" element={<AdminUlasanPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
);
