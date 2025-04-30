'use client';
import { useEffect, useState } from "react";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // ✅ Registrar el Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js").catch(console.error);
    }

    // ✅ Mostrar banner personalizado cuando se dispare el evento
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
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
      });
    }
  };

  return (
    <>
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
    </>
  );
}
