import React from "react";
import NavbarHome from "./ui/NavbarHome";

export default function Layout({ children }) {
    return (
        <>
            <NavbarHome />
            <div className="pt-20">
                {children}
            </div>
        </>
    );
}