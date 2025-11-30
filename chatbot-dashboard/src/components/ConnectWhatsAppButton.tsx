"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/utils/api";

type Props = {
  disabled?: boolean;
  tenantId?: string; // lo dejamos por compatibilidad, aunque no lo usamos
};

export default function ConnectWhatsAppButton({ disabled }: Props) {
  const router = useRouter();
  const popupRef = useRef<Window | null>(null);
  const [checking, setChecking] = useState(false);

  const handleClick = async () => {
    if (disabled) return;

    try {
      console.log("[WA META] Iniciando flujo de conexión con Meta…");

      const res = await fetch(
        `${BACKEND_URL}/api/meta/whatsapp-onboard/start`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
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

      const popup = window.open(
        data.url,
        "wa-meta-onboard",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      popupRef.current = popup;
      setChecking(true); // empezamos a vigilar el estado
    } catch (error) {
      console.error(
        "[WA META] Error inesperado en ConnectWhatsAppButton:",
        error
      );
      alert(
        "Ocurrió un error al iniciar la conexión con WhatsApp Business. Inténtalo nuevamente."
      );
    }
  };

  // Polling para ver cuándo Meta terminó y el tenant quedó conectado
  useEffect(() => {
    if (!checking) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/meta/whatsapp/accounts`,
          {
            credentials: "include",
          }
        );

        if (!res.ok) return;

        const data = await res.json();

        // ✅ Soportamos el formato nuevo { accounts } y el viejo { phoneNumbers }
        const phones =
          (Array.isArray(data?.accounts) && data.accounts) ||
          (Array.isArray(data?.phoneNumbers) && data.phoneNumbers) ||
          [];

        if (phones.length > 0) {
          console.log("[WA META] Número detectado en backend:", phones);

          // Cortamos el polling
          setChecking(false);
          clearInterval(interval);

          // Cerramos el popup si sigue abierto
          if (popupRef.current && !popupRef.current.closed) {
            popupRef.current.close();
          }

          // Refrescamos la vista para que se vea el número
          router.refresh();
        }
      } catch (e) {
        console.error("[WA META] Error consultando estado de WhatsApp:", e);
      }
    }, 5000); // cada 5 segundos

    return () => clearInterval(interval);
  }, [checking, router]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="mt-4 inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {checking
        ? "Conectando número de WhatsApp…"
        : "Conectar número oficial de WhatsApp"}
    </button>
  );
}
