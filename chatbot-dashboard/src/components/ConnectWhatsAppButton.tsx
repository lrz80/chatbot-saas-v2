// src/components/ConnectWhatsAppButton.tsx  (ruta que tengas)

"use client";

import { useEffect, useState, useCallback } from "react";
import { BACKEND_URL } from "@/utils/api";

const APP_ID = process.env.NEXT_PUBLIC_META_APP_ID!;
const CONFIG_ID = process.env.NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID!;

type ConnectWhatsAppButtonProps = {
  disabled?: boolean;
  tenantId?: string;
};

export default function ConnectWhatsAppButton({
  disabled,
  tenantId,
}: ConnectWhatsAppButtonProps) {
  const [loading, setLoading] = useState(false);

  // 1) Cargar SDK y listeners solo una vez
  useEffect(() => {
    if (typeof window === "undefined") return;

    const messageHandler = async (event: MessageEvent) => {
      if (
        event.origin !== "https://www.facebook.com" &&
        event.origin !== "https://web.facebook.com"
      ) {
        return;
      }

      try {
        const data = JSON.parse(event.data as string);

        if (data?.type !== "WA_EMBEDDED_SIGNUP") return;

        console.log("[WA ES] message recibido:", data);

        if (data.event === "FINISH") {
          const { phone_number_id, waba_id } = data.data || {};

          console.log("[WA ES] FINISH →", { phone_number_id, waba_id });

          if (!phone_number_id || !waba_id) {
            console.error(
              "[WA ES] Falta phone_number_id o waba_id en data.data"
            );
            return;
          }

          // Guardar en backend
          const res = await fetch(
            `${BACKEND_URL}/api/meta/whatsapp/onboard-complete`,
            {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                wabaId: waba_id,
                phoneNumberId: phone_number_id,
              }),
            }
          );

          const json = await res.json();
          console.log(
            "[WA ES] Respuesta /onboard-complete:",
            res.status,
            json
          );
        } else if (data.event === "CANCEL") {
          console.warn("[WA ES] Usuario CANCELÓ el flujo:", data.data);
        } else if (data.event === "ERROR") {
          console.error("[WA ES] ERROR en Embedded Signup:", data.data);
        }
      } catch (e) {
        console.log("[WA ES] Non JSON message:", event.data);
      }
    };

    window.addEventListener("message", messageHandler);

    if (!window.FB) {
      const id = "facebook-jssdk";
      if (!document.getElementById(id)) {
        const js = document.createElement("script");
        js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        document.body.appendChild(js);
      }

      window.fbAsyncInit = function () {
        window.FB.init({
          appId: APP_ID,
          autoLogAppEvents: true,
          xfbml: false,
          version: "v18.0",
        });
        console.log("[WA ES] FB SDK inicializado");
      };
    }

    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, []);

  // 2) Lanzar Embedded Signup
  const handleConnect = useCallback(() => {
    if (disabled || !tenantId) return;

    if (typeof window === "undefined" || !window.FB) {
      console.error("[WA ES] FB SDK aún no cargado");
      return;
    }

    setLoading(true);

    // IMPORTANTE: función normal, NO async
    const fbLoginCallback = (response: any) => {
      console.log("[WA ES] fbLoginCallback:", response);

      // Ejecutamos lógica async dentro de una IIFE
      (async () => {
        try {
          if (response?.authResponse?.code) {
            const code = response.authResponse.code as string;
            console.log("[WA ES] Code recibido:", code);

            const res = await fetch(
              `${BACKEND_URL}/api/meta/whatsapp/exchange-code`,
              {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
              }
            );

            const json = await res.json();
            console.log(
              "[WA ES] Respuesta /exchange-code:",
              res.status,
              json
            );
          } else {
            console.warn("[WA ES] fbLoginCallback sin authResponse");
          }
        } catch (e) {
          console.error("[WA ES] Error llamando /exchange-code:", e);
        } finally {
          setLoading(false);
        }
      })();
    };

    window.FB.login(fbLoginCallback, {
      config_id: CONFIG_ID,
      response_type: "code",
      override_default_response_type: true,
      extras: { version: "v3" },
    });
  }, [disabled, tenantId]);

  const isDisabled = disabled || !tenantId;

  return (
    <button
      type="button"
      onClick={handleConnect}
      disabled={isDisabled}
      className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
    >
      {loading ? "Conectando WhatsApp…" : "Conectar WhatsApp Cloud"}
    </button>
  );
}
