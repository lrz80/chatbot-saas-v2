// src/app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ClientWrapper from "./ClientWrapper";
import ConditionalNavbar from "@/components/ConditionalNavbar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aamy AI",
  description: "Automatiza tu negocio con Aamy.AI, tu asistente 24/7.",
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0f0a1e",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        {/* Etiqueta para que los navegadores detecten correctamente el idioma original */}
        <meta httpEquiv="content-language" content="es" />

        {/* Facebook domain verification */}
        <meta
          name="facebook-domain-verification"
          content="yw55oh02053to5oxntgp0pvm19sw2z"
        />
      </head>

      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ConditionalNavbar />
        <ClientWrapper>{children}</ClientWrapper>
        <ToastContainer position="top-right" autoClose={3000} />
      </body>
    </html>
  );
}
