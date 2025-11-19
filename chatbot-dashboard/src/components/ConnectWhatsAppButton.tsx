"use client";

import React from "react";
import { MdWhatsapp } from "react-icons/md";

type Props = {
  disabled?: boolean;
};

export default function ConnectWhatsAppButton({ disabled }: Props) {
  // 👉 URL generado desde Meta, debes reemplazar con TU URL
  const EMBEDDED_SIGNUP_URL =
    "https://business.facebook.com/messaging/whatsapp/onboard/?app_id=672113805196816&config_id=1588077632361933";

  const handleConnect = () => {
    if (!EMBEDDED_SIGNUP_URL) {
      alert("No se encontró la URL de conexión. Contacta soporte.");
      return;
    }
    // Abrir en pestaña nueva (o popup si prefieres)
    window.open(EMBEDDED_SIGNUP_URL, "_blank", "width=900,height=750");
  };

  return (
    <button
      disabled={disabled}
      onClick={handleConnect}
      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition
        ${
          !disabled
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-gray-600 text-white/50 cursor-not-allowed"
        }`}
    >
      <MdWhatsapp className="mr-2" size={18} />
      Conectar número oficial de WhatsApp
    </button>
  );
}
