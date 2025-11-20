"use client";

import React from "react";
import { MdWhatsapp } from "react-icons/md";

type Props = {
  disabled?: boolean;
  tenantId?: string;
};

export default function ConnectWhatsAppButton({ disabled, tenantId }: Props) {
  // URL base de Embedded Signup (app_id + config_id)
  const BASE_EMBEDDED_SIGNUP_URL =
    "https://business.facebook.com/messaging/whatsapp/onboard/?app_id=672113805196816&config_id=1588077632361933";

  // A dónde Meta va a redirigir cuando termines el flujo
  const REDIRECT_URI = "https://www.aamy.ai/meta/whatsapp-redirect";

  const handleConnect = () => {
    if (!tenantId) {
      alert(
        "No se encontró el ID del negocio. Recarga la página o contacta soporte."
      );
      return;
    }

    const url =
      `${BASE_EMBEDDED_SIGNUP_URL}` +
      `&state=${encodeURIComponent(tenantId)}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

    console.log("🌐 Abriendo Embedded Signup URL:", url);

    window.open(url, "_blank", "width=900,height=750");
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
