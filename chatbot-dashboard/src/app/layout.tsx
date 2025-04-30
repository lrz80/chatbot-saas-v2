'use client';

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect, useState } from "react";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aamy AI",
  description: "Automatiza tu negocio con Aamy.AI, tu asistente 24/7.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Registrar service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js");
    }

    // Capturar evento de instalación diferida
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    });
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(() => {
        setShowInstallBanner(false);
      });
    }
  };

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {showInstallBanner && (
          <div className="fixed bottom-4 left-4 right-4 bg-purple-800 text-white px-6 py-4 rounded-xl shadow-lg flex justify-between items-center z-50">
            <span>📱 Instala Aamy.AI como App</span>
            <button
              onClick={handleInstall}
              className="ml-4 bg-white text-purple-800 font-bold py-2 px-4 rounded-lg"
            >
              Instalar
            </button>
          </div>
        )}

        {children}
        <ToastContainer position="top-right" autoClose={3000} />
      </body>
    </html>
  );
}


