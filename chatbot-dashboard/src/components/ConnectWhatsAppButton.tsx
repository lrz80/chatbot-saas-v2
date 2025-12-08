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

      const url: string = data.url;

      // 🔍 Detección simple de móvil
      const isMobile =
        typeof window !== "undefined" &&
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (isMobile) {
        // 📱 En móvil NO usamos popup: redirigimos en la misma pestaña
        console.log("[WA META] Redirigiendo a flujo Meta en móvil…");
        window.location.href = url;
        return; // no activamos checking ni popup
      }

      // 🖥️ Desktop: intentamos abrir popup centrado
      const width = 1000;
      const height = 800;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      console.log("[WA META] Abriendo URL de Meta en popup:", url);

      const popup = window.open(
        url,
        "wa-meta-onboard",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Si el navegador bloquea el popup → fallback a redirección directa
      if (!popup) {
        console.warn(
          "[WA META] Popup bloqueado, usando redirección directa en desktop…"
        );
        window.location.href = url;
        return;
      }

      popupRef.current = popup;
      setChecking(true); // empezamos a vigilar el estado sólo si hay popup
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

        // Si ya hay al menos un número conectado en DB, damos por finalizado
        if (Array.isArray(data?.phoneNumbers) && data.phoneNumbers.length > 0) {
          console.log("[WA META] Número detectado en DB:", data.phoneNumbers);

          setChecking(false);
          clearInterval(interval);

          // Cerramos popup si sigue abierto
          if (popupRef.current && !popupRef.current.closed) {
            popupRef.current.close();
          }

          // Refrescamos la página / estado para que ChannelStatus muestre "conectado"
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
