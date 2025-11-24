"use client";

import { BACKEND_URL } from "@/utils/api";

type Props = {
  disabled?: boolean;
  tenantId?: string;
};

export default function ConnectWhatsAppButton({ disabled, tenantId }: Props) {
  const handleClick = async () => {
    if (disabled) return;

    try {
      console.log("[WA META] Iniciando flujo de conexión con Meta…");

      const res = await fetch(
        `${BACKEND_URL}/api/meta/whatsapp-onboard/start`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tenantId }), // opcional: el backend puede usar req.user.tenant_id
        }
      );

      if (!res.ok) {
        console.error(
          "[WA META] Error al iniciar onboarding:",
          res.status,
          res.statusText
        );
        alert(
          "No se pudo iniciar la conexión con WhatsApp Business. Inténtalo de nuevo o contacta al administrador."
        );
        return;
      }

      const data = await res.json();

      if (!data?.url) {
        console.error("[WA META] Respuesta sin URL válida:", data);
        alert(
          "No se recibió la URL de conexión de Meta. Inténtalo más tarde o contacta al administrador."
        );
        return;
      }

      const width = 1000;
      const height = 800;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      console.log("[WA META] Abriendo URL de Meta:", data.url);

      window.open(
        data.url,
        "wa-meta-onboard",
        `width=${width},height=${height},left=${left},top=${top}`
      );
    } catch (error) {
      console.error("[WA META] Error inesperado en ConnectWhatsAppButton:", error);
      alert(
        "Ocurrió un error al iniciar la conexión con WhatsApp Business. Inténtalo nuevamente."
      );
    }
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
