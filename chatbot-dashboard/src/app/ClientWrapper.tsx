'use client';
import { useEffect, useState } from "react";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js").catch(console.error);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // ✅ Proteger acceso a sessionStorage
      let alreadyShown = false;
      try {
        alreadyShown = typeof window !== "undefined" && sessionStorage.getItem("install-banner-dismissed") === "true";
      } catch (err) {
        console.warn("⚠️ sessionStorage no accesible:", err);
      }

      if (!alreadyShown) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(() => {
        setShowInstallBanner(false);
        try {
          sessionStorage.setItem("install-banner-dismissed", "true");
        } catch (err) {
          console.warn("⚠️ No se pudo guardar en sessionStorage:", err);
        }
      });
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    try {
      sessionStorage.setItem("install-banner-dismissed", "true");
    } catch (err) {
      console.warn("⚠️ No se pudo guardar en sessionStorage:", err);
    }
  };

  return (
    <>
      {showInstallBanner && (
        <div className="fixed bottom-4 left-4 right-4 bg-purple-800 text-white px-6 py-4 rounded-xl shadow-lg flex justify-between items-center z-50">
          <span>📱 Instala Aamy.AI como App</span>
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="bg-white text-purple-800 font-bold py-2 px-4 rounded-lg"
            >
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="bg-transparent border border-white text-white font-bold py-2 px-4 rounded-lg"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
