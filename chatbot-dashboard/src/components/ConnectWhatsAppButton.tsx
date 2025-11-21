"use client";

import { useRef } from "react";
import { BACKEND_URL } from "@/utils/api";

type Props = {
  disabled?: boolean;
  tenantId?: string;          // 👈 AQUÍ añadimos la prop que estás usando en TrainingPage
};

// URL base que te dio Meta para Embedded Signup (configurada en Vercel)
const EMBEDDED_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_EMBEDDED_URL || "";

export default function ConnectWhatsAppButton({ disabled, tenantId }: Props) {
  // ✅ useRef bien tipado y con valor inicial null
  const listenerRef = useRef<((event: MessageEvent) => void) | null>(null);

  const handleClick = () => {
    if (!EMBEDDED_URL) {
      console.error("[WA EMBEDDED] Falta NEXT_PUBLIC_WHATSAPP_EMBEDDED_URL en el frontend");
      alert(
        "No se ha configurado la URL de conexión de WhatsApp. Contacta al administrador."
      );
      return;
    }

    // Limpia listener previo si existía
    if (listenerRef.current) {
      window.removeEventListener("message", listenerRef.current);
      listenerRef.current = null;
    }

    const listener = async (event: MessageEvent) => {
      // Solo aceptamos mensajes desde Facebook
      if (
        event.origin !== "https://www.facebook.com" &&
        event.origin !== "https://business.facebook.com"
      ) {
        return;
      }

      let payload: any;
      try {
        payload =
          typeof event.data === "string"
            ? JSON.parse(event.data)
            : event.data;
      } catch (e) {
        console.warn("[WA EMBEDDED] No se pudo parsear event.data", e);
        return;
      }

      // Meta envía algo del estilo { type: "WA_EMBEDDED_SIGNUP", data: { ... } }
      if (payload?.type !== "WA_EMBEDDED_SIGNUP") {
        return;
      }

      console.log("[WA EMBEDDED] mensaje recibido:", payload);

      const data = payload.data || {};
      const waba_id =
        data.waba_id || data.whatsapp_business_account_id || null;
      const phone_number_id = data.phone_number_id || null;
      const phone_number = data.phone_number || null;
      const access_token =
        data.access_token || payload.access_token || null;

      try {
        const r = await fetch(
          `${BACKEND_URL}/api/meta/whatsapp/onboard-complete`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              waba_id,
              phone_number_id,
              phone_number,
              access_token,
              tenantId,                 // 👈 opcional: también se lo mandamos al backend
            }),
          }
        );

        if (!r.ok) {
          console.error(
            "[WA EMBEDDED] Error guardando en backend",
            await r.text()
          );
          alert(
            "Se conectó el número en Meta, pero hubo un error guardando los datos en Aamy. Revisa los logs."
          );
        } else {
          console.log("[WA EMBEDDED] Guardado correctamente");
          window.location.href = "/meta/whatsapp-connected";
        }
      } catch (err) {
        console.error("[WA EMBEDDED] Error llamando al backend", err);
        alert(
          "Se produjo un error al guardar la configuración de WhatsApp. Intenta de nuevo."
        );
      } finally {
        if (listenerRef.current) {
          window.removeEventListener("message", listenerRef.current);
          listenerRef.current = null;
        }
      }
    };

    listenerRef.current = listener;
    window.addEventListener("message", listener);

    // Construimos la URL; si quieres pasar el tenantId como state a Meta:
    const urlWithState =
      tenantId
        ? `${EMBEDDED_URL}${EMBEDDED_URL.includes("?") ? "&" : "?"}state=${encodeURIComponent(
            tenantId
          )}`
        : EMBEDDED_URL;

    const width = 1000;
    const height = 800;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      urlWithState,
      "wa-embedded-signup",
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
