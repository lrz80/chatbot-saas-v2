"use client";

import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";

type Props = {
  disabled?: boolean;
  tenantId?: string;
};

const META_APP_ID =
  process.env.NEXT_PUBLIC_META_APP_ID || "672113805196816";
const META_EMBEDDED_SIGNUP_CONFIG_ID =
  process.env.NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID ||
  "1588077632361933";

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: any;
  }
}

export default function ConnectWhatsAppButton({ disabled }: Props) {
  const [loading, setLoading] = useState(false);
  const [fbReady, setFbReady] = useState(false);

  // ✅ Cargar el SDK de Facebook una sola vez
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Si ya está cargado, marcamos listo
    if (window.FB) {
      setFbReady(true);
      return;
    }

    // Si ya existe el script, esperamos a que cargue
    const existingScript = document.getElementById("facebook-jssdk");
    if (existingScript) {
      existingScript.addEventListener("load", () => setFbReady(true));
      return;
    }

    // Definimos fbAsyncInit y cargamos el script
    window.fbAsyncInit = function () {
      window.FB?.init({
        appId: META_APP_ID,
        cookie: true,
        xfbml: false,
        version: "v18.0",
      });
      setFbReady(true);
      console.log("[WA META] FB SDK inicializado");
    };

    const js = document.createElement("script");
    js.id = "facebook-jssdk";
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    js.onload = () => {
      console.log("[WA META] Script FB SDK cargado");
    };
    document.body.appendChild(js);
  }, []);

  const handleClick = async () => {
    if (disabled || loading) return;

    if (!fbReady || !window.FB) {
      console.error("[WA META] FB SDK aún no está listo");
      alert(
        "Estamos cargando la conexión con Meta. Espera un momento y vuelve a intentar."
      );
      return;
    }

    if (!META_EMBEDDED_SIGNUP_CONFIG_ID) {
      console.error(
        "[WA META] Falta NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID"
      );
      alert(
        "Falta configuración de WhatsApp en el frontend. Contacta al administrador."
      );
      return;
    }

    try {
      setLoading(true);
      console.log("[WA META] Iniciando Embedded Signup con FB.login…");

      window.FB.login(
        async (response: any) => {
          console.log("[WA META] Respuesta FB.login:", response);

          try {
            if (
              response.status === "connected" &&
              response.authResponse &&
              response.authResponse.code
            ) {
              const code = response.authResponse.code as string;
              console.log("[WA META] Código recibido de Embedded Signup:", code);

              const res = await fetch(
                `${BACKEND_URL}/api/meta/whatsapp/exchange-code`,
                {
                  method: "POST",
                  credentials: "include",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ code }),
                }
              );

              if (!res.ok) {
                const detail = await res.json().catch(() => ({}));
                console.error(
                  "[WA META] Error al intercambiar code en backend:",
                  res.status,
                  detail
                );
                alert(
                  "No se pudo guardar la conexión de WhatsApp en el servidor. Inténtalo nuevamente o contacta al administrador."
                );
              } else {
                console.log(
                  "[WA META] Código intercambiado y token guardado correctamente"
                );
                alert("WhatsApp se ha conectado correctamente 🎉");
                // TODO: aquí puedes disparar un refetch del estado en el dashboard
              }
            } else {
              console.warn(
                "[WA META] Usuario canceló o no completó el Embedded Signup:",
                response
              );
              alert(
                "No se completó la conexión con WhatsApp. Vuelve a intentarlo si fue un error."
              );
            }
          } catch (err) {
            console.error(
              "[WA META] Error en callback de FB.login / exchange-code:",
              err
            );
            alert(
              "Ocurrió un error al guardar la conexión de WhatsApp. Inténtalo nuevamente."
            );
          } finally {
            setLoading(false);
          }
        },
        {
          config_id: META_EMBEDDED_SIGNUP_CONFIG_ID,
          response_type: "code",
          override_default_response_type: true,
          extras: {
            feature: "whatsapp_embedded_signup",
            sessionInfoVersion: "3",
          },
        }
      );
    } catch (error) {
      console.error("[WA META] Error inesperado en ConnectWhatsAppButton:", error);
      alert(
        "Ocurrió un error al iniciar la conexión con WhatsApp Business. Inténtalo nuevamente."
      );
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className="mt-4 inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading
        ? "Conectando con WhatsApp…"
        : "Conectar número oficial de WhatsApp"}
    </button>
  );
}
