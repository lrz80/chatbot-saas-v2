"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function WhatsAppConnectedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState<string>("Procesando conexión...");

  useEffect(() => {
    // 1. Leer parámetros devueltos por Meta
    const code = searchParams.get("code");
    const wabaId = searchParams.get("waba_id");
    const phoneNumberId = searchParams.get("phone_number_id");

    // Si no vino nada, marcamos error simple
    if (!code && !wabaId && !phoneNumberId) {
      setStatus("error");
      setMessage(
        "No se recibieron datos de WhatsApp. Cierra esta ventana e intenta de nuevo."
      );
      return;
    }

    // 2. Llamar a tu backend para guardar en la DB
    const sendToBackend = async () => {
      try {
        const resp = await fetch(
          "https://api.aamy.ai/api/meta/whatsapp/onboard-complete",
          {
            method: "POST",
            credentials: "include", // usa tus cookies de sesión
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code,
              waba_id: wabaId,
              phone_number_id: phoneNumberId,
            }),
          }
        );

        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          console.error("Error backend:", data);
          setStatus("error");
          setMessage(
            data?.error ||
              "No se pudo guardar la conexión de WhatsApp. Intenta nuevamente."
          );
          return;
        }

        setStatus("ok");
        setMessage("Conexión de WhatsApp guardada correctamente.");

        // 3. Redirigir al dashboard de WhatsApp después de unos segundos
        setTimeout(() => {
          router.replace("/dashboard/whatsapp"); // ajusta la ruta si tu página es otra
        }, 2000);
      } catch (err) {
        console.error(err);
        setStatus("error");
        setMessage(
          "Error de red al hablar con el servidor. Intenta nuevamente."
        );
      }
    };

    sendToBackend();
  }, [router, searchParams]);

  const isOk = status === "ok";
  const isError = status === "error";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="bg-slate-900/80 rounded-xl px-6 py-5 shadow-lg border border-slate-700 max-w-md text-center">
        <p className="text-lg font-semibold mb-2">
          {isOk
            ? "Conexión con WhatsApp completada"
            : isError
            ? "Hubo un problema con la conexión"
            : "Procesando conexión con WhatsApp..."}
        </p>
        <p className="text-sm text-slate-300">{message}</p>
      </div>
    </div>
  );
}
