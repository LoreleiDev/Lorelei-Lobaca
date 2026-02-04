import React from "react";
import { FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";
import {
    Package,
    Headphones,
    Truck,
    CreditCard,
    Shield
} from "lucide-react";
// Import gambar QRIS dari SVG
import qrisImage from "../../assets/qris.svg";

export default function Footer() {
    return (
        <footer className="text-gray-600 w-full relative">
            {/* Bagian Konten Footer */}
            <div className="bg-linear-to-b from-gray-50 to-gray-100 border-t border-gray-200 py-12 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
                        {/* Tentang Lobaca */}
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-gray-800 w-10 h-10 rounded-lg flex items-center justify-center">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800">Lobaca</h3>
                            </div>
                            <p className="text-gray-600 leading-relaxed mb-6 max-w-md">
                                Platform penjualan buku online terpercaya. Menyediakan berbagai koleksi
                                buku berkualitas dengan pengalaman belanja yang aman dan nyaman.
                            </p>
                        </div>

                        {/* Kontak & Sosial Media */}
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Hubungi Kami
                            </h4>
                            <ul className="space-y-4">
                                <li>
                                    <a
                                        href="https://instagram.com/lobacaofc"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 text-gray-600 hover:text-pink-600 transition-colors duration-200 group"
                                    >
                                        <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-pink-50 transition-colors">
                                            <FaInstagram className="text-lg" />
                                        </div>
                                        <div>
                                            <span className="font-medium">Instagram</span>
                                            <p className="text-sm text-gray-500">@lobacaofc</p>
                                        </div>
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://tiktok.com/@lobaca.id"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors duration-200 group"
                                    >
                                        <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-gray-200 transition-colors">
                                            <FaTiktok className="text-lg" />
                                        </div>
                                        <div>
                                            <span className="font-medium">TikTok</span>
                                            <p className="text-sm text-gray-500">@lobaca.id</p>
                                        </div>
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://wa.me/6285174116973"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 text-gray-600 hover:text-green-600 transition-colors duration-200 group"
                                    >
                                        <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-green-50 transition-colors">
                                            <FaWhatsapp className="text-lg" />
                                        </div>
                                        <div>
                                            <span className="font-medium">WhatsApp</span>
                                            <p className="text-sm text-gray-500">+62 851-7411-6973</p>
                                        </div>
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Layanan */}
                        <div>
                            <div className="p-4  max-w-35">
                                <div className="flex items-center justify-center">
                                    <img
                                        src={qrisImage}
                                        alt="QRIS Payment"
                                        className="w-32 h-32 object-contain"
                                    />
                                </div>
                            </div>
                        </div>


                    </div>

                </div>
            </div>

            {/* Bagian Copyright */}
            <div className="bg-gray-900 py-6 text-center">
                <div className="max-w-6xl mx-auto px-4">
                    <p className="text-sm text-gray-400">
                        © {new Date().getFullYear()} Lobaca by Lorelei-Project | All Rights Reserved
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                        Platform jual-beli buku online terpercaya di Indonesia
                    </p>
                </div>
            </div>
        </footer>
    );
}