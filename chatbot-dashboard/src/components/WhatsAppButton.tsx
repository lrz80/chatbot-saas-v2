"use client";

import { useEffect, useState } from "react";

export default function WhatsAppButton() {
  const [audio] = useState(() => new Audio("/mensaje.mp3")); // Ruta al sonido (asegúrate de tener el archivo)
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Mostrar botón y reproducir sonido solo una vez al montar
    setVisible(true);
    audio.play().catch((err) => console.warn("🔕 Sonido bloqueado por el navegador:", err));
  }, []);

  const numeroWhatsApp = "13057206515"; // Cambiar por número de soporte Aamy AI
  const mensaje = encodeURIComponent("¡Hola! Estoy interesado en conocer más sobre Aamy AI.");
  const linkWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensaje}`;

  return (
    <>
      {visible && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className="relative flex flex-col items-end">
            {/* Botón de WhatsApp */}
            <div
              className="bg-green-500 rounded-full w-16 h-16 flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform"
              onClick={() => window.open(linkWhatsApp, "_blank")}
            >
              <img src="/whatsapp-icon.png" alt="WhatsApp" className="w-10 h-10" />
            </div>

            {/* Burbuja con información */}
            <div className="absolute bottom-20 right-0 bg-white text-black p-3 rounded-lg shadow-lg w-64 max-w-full">
              <div className="flex items-center gap-2">
                <img src="/logo-aamyai.png" alt="Aamy AI Logo" className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-semibold text-sm">Aamy AI</p>
                  <p className="text-xs text-gray-600">Soporte</p>
                </div>
              </div>
              <button
                onClick={() => window.open(linkWhatsApp, "_blank")}
                className="mt-2 bg-green-500 text-white px-3 py-1 rounded-full w-full text-sm"
              >
                Iniciar Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
