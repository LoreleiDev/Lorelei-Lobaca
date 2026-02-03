import "../css/app.css";
import "./bootstrap";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from './hooks/UseCart';
import { WishlistProvider } from './hooks/WishlistProvider';
import { NotificationProvider } from './hooks/NotificationProvider';
import Layout from './components/Layouts';
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
import DetailTransaksiPage from "./components/DetailTransaksi";
import RiwayatPesanan from "./components/RiwayatPesanan";
import Notifikasi from "./components/Notifikasi";
import AdminRoute from "./components/admin/AdminRoutes";
import AdminLogin from "./components/admin/LoginAdmin";
import AdminDashboard from "./components/admin/Dashboard";
import AdminUpload from "./components/admin/Upload";
import AdminInventory from "./components/admin/InventoryPages";
import AdminEditInventory from "./components/admin/BookEditPages";
import AdminPromoSetting from "./components/admin/PromoSetting";
import AdminUlasanPage from "./components/admin/UlasanUser";
import AdminPesananPage from "./components/admin/KelolaPesanan";

ReactDOM.createRoot(document.getElementById("app")).render(
    <React.StrictMode>
        <BrowserRouter>
            <CartProvider>
                <WishlistProvider>
                    <NotificationProvider>
                        <Routes>
                            <Route path="/register" element={<Register />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/password/forgot" element={<ForgotPassword />} />
                            <Route index element={
                                <Layout>
                                    <Home />
                                </Layout>
                            } />
                            <Route path="/buku" element={
                                <Layout>
                                    <Buku />
                                </Layout>
                            } />
                            <Route path="/search" element={
                                <Layout>
                                    <Search />
                                </Layout>
                            } />
                            <Route path="/buku/:id" element={
                                <Layout>
                                    <BukuDetail />
                                </Layout>
                            } />
                            <Route path="/wishlist" element={
                                <Layout>
                                    <WishlistPage />
                                </Layout>
                            } />
                            <Route path="/promo" element={
                                <Layout>
                                    <PromoPage />
                                </Layout>
                            } />
                            <Route path="/promo/:id" element={
                                <Layout>
                                    <PromoDetailPage />
                                </Layout>
                            } />
                            <Route path="/cart" element={
                                <Layout>
                                    <KeranjangPage />
                                </Layout>
                            } />
                            <Route path="/payment" element={<PaymentSelector />} />
                            <Route path="/alamat-kurir" element={<AddressCourierSelector />} />
                            <Route path="/payment-qris" element={<PaymentQris />} />
                            <Route path="/transaksi" element={<DetailTransaksiPage />} />
                            <Route path="/purchase-history" element={
                                <Layout>
                                    <RiwayatPesanan />
                                </Layout>
                            } />
                            <Route path="/notifications" element={
                                <Layout>
                                    <Notifikasi />
                                </Layout>
                            } />
                            <Route element={<UserRoute />}>
                                <Route path="/profile" element={
                                    <Layout>
                                        <Profile />
                                    </Layout>
                                } />
                                <Route path="/password/edit" element={<EditPassword />} />
                                <Route path="/email/edit" element={<ChangeEmail />} />
                            </Route>
                            <Route path="/admin/login" element={<AdminLogin />} />
                            <Route element={<AdminRoute />}>
                                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                                <Route path="/admin/upload" element={<AdminUpload />} />
                                <Route path="/admin/inventory" element={<AdminInventory />} />
                                <Route path="/admin/inventory/:id" element={<AdminEditInventory />} />
                                <Route path="/admin/promo" element={<AdminPromoSetting />} />
                                <Route path="/admin/ulasan" element={<AdminUlasanPage />} />
                                <Route path="/admin/pesanan" element={<AdminPesananPage />} />
                            </Route>
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </NotificationProvider>
                </WishlistProvider>
            </CartProvider>
        </BrowserRouter>
    </React.StrictMode>
);