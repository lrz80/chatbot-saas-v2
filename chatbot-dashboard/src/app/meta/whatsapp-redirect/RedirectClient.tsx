// src/app/meta/whatsapp-redirect/RedirectClient.tsx
"use client";

import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";

declare global {
  interface Window {
    FB: any;
  }
}

const APP_ID = "672113805196816";         // Tu App ID (no es secreto)
const CONFIG_ID = "1588077632361933";     // Tu config_id del Embedded Signup
const FB_SDK_URL = "https://connect.facebook.net/en_US/sdk.js";

export default function RedirectClient() {
  const [status, setStatus] = useState<string>(
    "Inicializando conexión con Meta…"
  );

  useEffect(() => {
    let messageHandler: (event: MessageEvent) => void;

    const loadFacebookSdk = () =>
      new Promise<void>((resolve, reject) => {
        if (window.FB) {
          return resolve();
        }

        const existingScript = document.querySelector<HTMLScriptElement>(
          `script[src="${FB_SDK_URL}"]`
        );
        if (existingScript) {
          existingScript.onload = () => resolve();
          existingScript.onerror = () => reject(new Error("FB SDK error"));
          return;
        }

        const script = document.createElement("script");
        script.src = FB_SDK_URL;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("FB SDK error"));
        document.body.appendChild(script);
      });

    const initFacebook = () => {
      if (!window.FB) {
        throw new Error("FB SDK no disponible");
      }

      window.FB.init({
        appId: APP_ID,
        autoLogAppEvents: true,
        xfbml: false,
        version: "v24.0",
      });
    };

    const registerMessageListener = () => {
      messageHandler = async (event: MessageEvent) => {
        if (
          event.origin !== "https://www.facebook.com" &&
          event.origin !== "https://web.facebook.com"
        ) {
          return;
        }

        try {
          const data = JSON.parse(event.data as string);

          if (data.type === "WA_EMBEDDED_SIGNUP") {
            if (data.event === "FINISH") {
              // ✅ Usuario terminó el flujo
              const { phone_number_id, waba_id } = data.data || {};

              console.log("[WA META] FINISH:", { phone_number_id, waba_id });
              setStatus("Guardando número de WhatsApp en Aamy…");

              try {
                const res = await fetch(
                  `${BACKEND_URL}/api/meta/whatsapp/onboard-complete`,
                  {
                    method: "POST",
                    credentials: "include",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      phoneNumberId: phone_number_id,
                      wabaId: waba_id,
                    }),
                  }
                );

                if (!res.ok) {
                  console.error(
                    "[WA META] Error al guardar en backend:",
                    res.status,
                    res.statusText
                  );
                  setStatus(
                    "Error guardando la conexión en Aamy. Contacta al administrador."
                  );
                  return;
                }

                setStatus("Conexión completada. Cerrando ventana…");

                // 🔁 Refrescar dashboard y cerrar popup
                try {
                  if (window.opener && !window.opener.closed) {
                    window.opener.location.href =
                      "/dashboard/training?whatsapp=connected";
                    window.close();
                  } else {
                    window.location.href =
                      "/dashboard/training?whatsapp=connected";
                  }
                } catch (e) {
                  console.error("Error cerrando ventana:", e);
                  window.location.href =
                    "/dashboard/training?whatsapp=connected";
                }
              } catch (err) {
                console.error(
                  "[WA META] Error inesperado al llamar onboard-complete:",
                  err
                );
                setStatus(
                  "Error inesperado guardando la conexión en Aamy. Intenta nuevamente."
                );
              }
            } else if (data.event === "CANCEL") {
              console.warn("[WA META] Usuario canceló el Embedded Signup");
              setStatus("Conexión cancelada.");
            } else if (data.event === "ERROR") {
              console.error("[WA META] Error en Embedded Signup:", data.data);
              setStatus("Ocurrió un error en el flujo de Meta.");
            }
          }
        } catch (e) {
          // Algunos mensajes de Meta no son JSON
          // console.log("Non JSON response:", event.data);
        }
      };

      window.addEventListener("message", messageHandler);
    };

    const launchWhatsAppSignup = () => {
      setStatus("Abriendo flujo de conexión de WhatsApp…");

      const fbLoginCallback = (response: any) => {
        console.log("[WA META] fbLoginCallback response:", response);
        // No usamos el "code" por ahora; el ID de número/WABA viene por WA_EMBEDDED_SIGNUP
      };

      window.FB.login(fbLoginCallback, {
        config_id: CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: { version: "v3" },
      });
    };

    (async () => {
      try {
        setStatus("Cargando SDK de Facebook…");
        await loadFacebookSdk();
        initFacebook();
        registerMessageListener();
        launchWhatsAppSignup();
      } catch (e) {
        console.error("[WA META] Error inicializando Embedded Signup:", e);
        setStatus(
          "No se pudo iniciar el flujo de conexión con Meta. Intenta nuevamente."
        );
      }
    })();

    return () => {
      if (messageHandler) {
        window.removeEventListener("message", messageHandler);
      }
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        background: "#050515",
        color: "#fff",
        padding: "1.5rem",
        textAlign: "center",
      }}
    >
      <div>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
          Conectando tu número de WhatsApp…
        </h1>
        <p style={{ opacity: 0.85 }}>{status}</p>
      </div>
    </div>
  );
}
