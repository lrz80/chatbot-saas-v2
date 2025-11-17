"use client";

import { useState } from "react";
import { BACKEND_URL } from "@/utils/api";

export default function ConnectWhatsAppButton() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClick = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const resp = await fetch(
        `${BACKEND_URL}/api/twilio/whatsapp/start-embedded-signup`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}), // por si tu middleware espera JSON
        }
      );

      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        console.error("Error start-embedded-signup:", resp.status, txt);
        setErrorMsg("No se pudo iniciar el registro de WhatsApp.");
        return;
      }

      const data = await resp.json();

      if (!data.signupUrl) {
        console.error("Respuesta sin signupUrl:", data);
        setErrorMsg("La respuesta no trajo el enlace de registro.");
        return;
      }

      // Redirige al flujo Embedded Signup de Twilio
      window.location.href = data.signupUrl;
    } catch (err) {
      console.error("Error inesperado:", err);
      setErrorMsg("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {loading ? "Conectando WhatsApp..." : "Conectar WhatsApp"}
      </button>
      {errorMsg && (
        <p className="text-xs text-red-500">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
