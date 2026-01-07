import React from "react";

import OVOIcon from "../../assets/ovo.webp";
import DanaIcon from "../../assets/dana.webp";
import GoPayIcon from "../../assets/gopay.webp";
import ShopeePayIcon from "../../assets/spay.webp";
import BRIIcon from "../../assets/briva.webp";
import { FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";

export default function Footer() {
    return (
        <footer className="text-gray-800 w-full relative">
            {/* Bagian Konten Footer */}
            <div className="bg-linear-to-b from-[#E7B807] to-[#d4a906] py-12 px-4 -mt-1"> 
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between gap-12">
                        {/* Bagian Layanan */}
                        <div className="flex-1">
                            <h4 className="font-bold text-xl mb-6 text-gray-900">Layanan</h4>
                            <ul className="space-y-3">
                                <li>
                                    <a
                                        href="#"
                                        className="text-gray-700 hover:text-black transition-colors duration-300 hover:underline underline-offset-4 inline-block"
                                    >
                                        Bantuan
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="text-gray-700 hover:text-black transition-colors duration-300 hover:underline underline-offset-4 inline-block"
                                    >
                                        Titip Jual
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="text-gray-700 hover:text-black transition-colors duration-300 hover:underline underline-offset-4 inline-block"
                                    >
                                        Pengiriman
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Bagian Ikuti Kami */}
                        <div className="flex-1">
                            <h4 className="font-bold text-xl mb-6 text-gray-900">Ikuti Kami</h4>
                            <ul className="space-y-4 text-gray-700">
                                <li>
                                    <a 
                                        href="https://instagram.com/lobacaofc" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 hover:text-black transition-colors duration-300 group w-fit"
                                    >
                                        <FaInstagram className="text-lg text-pink-600 transition-transform duration-300 group-hover:scale-110" />
                                        <span className="hover:underline underline-offset-4">lobacaofc</span>
                                    </a>
                                </li>
                                <li>
                                    <a 
                                        href="https://tiktok.com/@lobaca.id" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 hover:text-black transition-colors duration-300 group w-fit"
                                    >
                                        <FaTiktok className="text-lg text-gray-900 transition-transform duration-300 group-hover:scale-110" />
                                        <span className="hover:underline underline-offset-4">lobacaofc</span>
                                    </a>
                                </li>
                                <li>
                                    <a 
                                        href="https://wa.me/6285174116973" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 hover:text-black transition-colors duration-300 group w-fit"
                                    >
                                        <FaWhatsapp className="text-lg text-green-600 transition-transform duration-300 group-hover:scale-110" />
                                        <span className="hover:underline underline-offset-4">+62 851-7411-6973</span>
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Bagian Metode Pembayaran dengan Gambar */}
                        <div className="flex-1">
                            <h4 className="font-bold text-xl mb-6 text-gray-900">
                                Metode Pembayaran
                            </h4>
                            <div className="grid grid-cols-3 gap-3 max-w-xs">
                                <div className="bg-white p-3 rounded-lg flex flex-col items-center justify-center space-y-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                                    <img 
                                        src={OVOIcon} 
                                        alt="OVO" 
                                        className="w-7 h-7 object-contain"
                                    />
                                    <span className="text-xs font-medium">OVO</span>
                                </div>
                                <div className="bg-white p-3 rounded-lg flex flex-col items-center justify-center space-y-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                                    <img 
                                        src={DanaIcon} 
                                        alt="Dana" 
                                        className="w-7 h-7 object-contain"
                                    />
                                    <span className="text-xs font-medium">Dana</span>
                                </div>
                                <div className="bg-white p-3 rounded-lg flex flex-col items-center justify-center space-y-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                                    <img 
                                        src={GoPayIcon} 
                                        alt="GoPay" 
                                        className="w-7 h-7 object-contain"
                                    />
                                    <span className="text-xs font-medium">GoPay</span>
                                </div>
                                <div className="bg-white p-3 rounded-lg flex flex-col items-center justify-center space-y-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                                    <img 
                                        src={ShopeePayIcon} 
                                        alt="ShopeePay" 
                                        className="w-7 h-7 object-contain"
                                    />
                                    <span className="text-xs font-medium">ShopeePay</span>
                                </div>
                                <div className="bg-white p-3 rounded-lg flex flex-col items-center justify-center space-y-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 col-span-3">
                                    <img 
                                        src={BRIIcon} 
                                        alt="Bank BRI" 
                                        className="w-7 h-7 object-contain"
                                    />
                                    <span className="text-xs font-medium">Bank BRI</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Bagian Copyright */}
            <div className="bg-linear-to-r from-gray-900 to-black py-6 text-center text-white w-full">
                <p className="text-sm md:text-base">©Lobaca by Lorelei-Project 2025 | All Rights Reserved</p>
            </div>
        </footer>
    );
}
