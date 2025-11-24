"use client";

import { BACKEND_URL } from "@/utils/api";

type Props = {
  disabled?: boolean;
  tenantId?: string;
};

// URL base del flujo Hosted de WhatsApp (configurada en Vercel)
const HOSTED_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_HOSTED_URL || "";

export default function ConnectWhatsAppButton({ disabled, tenantId }: Props) {
  const handleClick = () => {
    if (disabled) return;

    if (!HOSTED_URL) {
      console.error(
        "[WA HOSTED] Falta NEXT_PUBLIC_WHATSAPP_HOSTED_URL en el frontend"
      );
      alert(
        "No se ha configurado la URL de conexión de WhatsApp. Contacta al administrador."
      );
      return;
    }

    // Pasamos el tenantId en el parámetro state para recuperarlo en el callback
    const urlWithState =
      tenantId
        ? `${HOSTED_URL}${
            HOSTED_URL.includes("?") ? "&" : "?"
          }state=${encodeURIComponent(tenantId)}`
        : HOSTED_URL;

    const width = 1000;
    const height = 800;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    console.log("[WA HOSTED] Abriendo onboarding:", urlWithState);

    window.open(
      urlWithState,
      "wa-hosted-signup",
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="mt-4 inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      Conectar número oficial de WhatsApp
    </button>
  );
}
