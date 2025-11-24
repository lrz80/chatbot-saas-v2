"use client";

import React from "react";
import { MdWhatsapp } from "react-icons/md";

type Props = {
  disabled?: boolean;
  tenantId?: string;
};

// URL base de Embedded Signup (app_id + config_id de tu app)
const BASE_EMBEDDED_SIGNUP_URL =
  "https://business.facebook.com/messaging/whatsapp/onboard/?app_id=672113805196816&config_id=1588077632361933";

// A dónde Meta va a redirigir cuando termine el flujo
const REDIRECT_URI = "https://www.aamy.ai/meta/whatsapp-redirect";

export default function ConnectWhatsAppButton({ disabled, tenantId }: Props) {
  const handleConnect = () => {
    if (!tenantId) {
      alert(
        "No se encontró el ID del negocio. Recarga la página o contacta soporte."
      );
      return;
    }

    // Construimos la URL con state (tenant) y redirect_uri
    const url =
      `${BASE_EMBEDDED_SIGNUP_URL}` +
      `&state=${encodeURIComponent(tenantId)}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

    console.log("🌐 Abriendo Embedded Signup URL:", url);

    const width = 1000;
    const height = 800;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      url,
      "wa-embedded-signup",
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleConnect}
      className={`mt-4 inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition
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
