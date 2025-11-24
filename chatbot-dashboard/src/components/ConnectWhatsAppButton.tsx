"use client";

import { useRef } from "react";
import { BACKEND_URL } from "@/utils/api";

type Props = {
  disabled?: boolean;
  tenantId?: string;
};

// URL que configuraste en Vercel
const EMBEDDED_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_EMBEDDED_URL || "";

export default function ConnectWhatsAppButton({ disabled, tenantId }: Props) {
  const listenerRef = useRef<((event: MessageEvent) => void) | null>(null);

  const handleClick = () => {
    if (!EMBEDDED_URL) {
      console.error(
        "[WA EMBEDDED] Falta NEXT_PUBLIC_WHATSAPP_EMBEDDED_URL en el frontend"
      );
      alert(
        "No se ha configurado la URL de conexión de WhatsApp. Contacta al administrador."
      );
      return;
    }

    // Limpia listener previo
    if (listenerRef.current) {
      window.removeEventListener("message", listenerRef.current);
      listenerRef.current = null;
    }

    const listener = async (event: MessageEvent) => {
      // DEBUG: loguea absolutamente todo lo que llegue
      console.log(
        "[WA DEBUG] message recibido",
        "origin=",
        event.origin,
        "data=",
        event.data
      );

      // Por ahora NO filtramos origin para ver qué está mandando Meta.
      if (!event.data) return;

      let payload: any = event.data;
      if (typeof event.data === "string") {
        try {
          payload = JSON.parse(event.data);
        } catch (e) {
          console.warn("[WA DEBUG] No se pudo parsear event.data como JSON", e);
        }
      }

      // Meta suele enviar algo tipo { type: 'WA_EMBEDDED_SIGNUP', data: {...} }
      const type = payload?.type || payload?.event || null;
      const core = payload?.data || payload || {};

      // Detectar posibles nombres de campos, siendo flexibles
      const wabaId =
        core.wa_waba_id ||
        core.waba_id ||
        core.whatsapp_business_account_id ||
        core.whatsapp_business_account?.id ||
        null;

      const phoneNumberId =
        core.wa_phone_number_id ||
        core.phone_number_id ||
        core.whatsapp_phone_number_id ||
        null;

      const phoneNumber =
        core.wa_phone_number || core.phone_number || core.display_phone_number || null;

      const accessToken =
        core.wa_persistent_token ||
        core.persistent_token ||
        core.access_token ||
        payload.access_token ||
        null;

      console.log("[WA DEBUG] tipo=", type, {
        wabaId,
        phoneNumberId,
        phoneNumber,
        accessToken,
      });

      // Si no hay ningún dato útil, salimos
      if (!wabaId && !phoneNumberId && !phoneNumber && !accessToken) {
        console.warn(
          "[WA DEBUG] Mensaje recibido pero sin campos de WhatsApp reconocibles, se ignora."
        );
        return;
      }

      try {
        const r = await fetch(
          `${BACKEND_URL}/api/meta/whatsapp/onboard-complete`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              waba_id: wabaId,
              phone_number_id: phoneNumberId,
              phone_number: phoneNumber,
              access_token: accessToken,
              tenantId,
              raw: payload, // opcional: por si quieres guardar TODO para debug
            }),
          }
        );

        if (!r.ok) {
          const txt = await r.text();
          console.error("[WA EMBEDDED] Error guardando en backend:", txt);
          alert(
            "Se conectó el número en Meta, pero hubo un error guardando los datos en Aamy. Revisa los logs."
          );
        } else {
          console.log("[WA EMBEDDED] Guardado correctamente en backend");
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

    // Abrimos la ventana de Meta
    const urlWithState =
      tenantId
        ? `${EMBEDDED_URL}${
            EMBEDDED_URL.includes("?") ? "&" : "?"
          }state=${encodeURIComponent(tenantId)}`
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
