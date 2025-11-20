"use client";

import React from "react";
import { MdWhatsapp } from "react-icons/md";

type Props = {
  disabled?: boolean;
};

export default function ConnectWhatsAppButton({ disabled }: Props) {
  // URL a la que Meta redirige cuando el cliente termina el Embedded Signup de WhatsApp
  const redirectUri = encodeURIComponent(
    "https://www.aamy.ai/dashboard/whatsapp-connected"
  );

  // URL de Embedded Signup con tu app_id, config_id y redirect_uri
  const EMBEDDED_SIGNUP_URL = `https://business.facebook.com/messaging/whatsapp/onboard/?app_id=672113805196816&config_id=1588077632361933&redirect_uri=${redirectUri}`;

  const handleConnect = () => {
    if (!EMBEDDED_SIGNUP_URL) {
      alert("No se encontró la URL de conexión. Contacta soporte.");
      return;
    }

    // Abrimos el flujo oficial de WhatsApp en una nueva ventana
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
