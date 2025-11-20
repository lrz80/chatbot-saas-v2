"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BACKEND_URL } from "@/utils/api";

export default function RedirectClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState<string>("Procesando conexión...");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // tenantId que mandamos en el botón

    console.log("🔁 /meta/whatsapp-redirect → code:", code, "state:", state);

    if (!code || !state) {
      setStatus("error");
      setMessage(
        "No se recibieron los datos de Meta correctamente. Cierra esta ventana e inténtalo de nuevo."
      );
      return;
    }

    const run = async () => {
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
              code,
              // por ahora solo enviamos el code; en el siguiente paso podremos
              // usar este code en el backend para leer waba_id y phone_number_id
            }),
          }
        );

        const json = await res.json().catch(() => ({} as any));
        console.log("✅ Respuesta /onboard-complete:", res.status, json);

        if (!res.ok) {
          setStatus("error");
          setMessage(
            json?.error ||
              "Ocurrió un error guardando la conexión de WhatsApp en Aamy."
          );
          return;
        }

        setStatus("ok");
        setMessage("WhatsApp conectado correctamente. Volviendo al dashboard...");

        setTimeout(() => {
          router.push("/dashboard/training");
        }, 2500);
      } catch (e) {
        console.error("❌ Error llamando /onboard-complete:", e);
        setStatus("error");
        setMessage(
          "Error de red al conectar con Aamy. Cierra esta ventana e inténtalo de nuevo."
        );
      }
    };

    run();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050516] text-white">
      <div className="max-w-md w-full text-center px-6 py-8 border border-white/10 rounded-xl bg-white/5">
        <h1 className="text-2xl font-bold mb-3">Conexión de WhatsApp</h1>
        <p className="mb-4">{message}</p>
        {status === "loading" && (
          <p className="text-sm text-white/60">Por favor, no cierres esta ventana…</p>
        )}
      </div>
    </div>
  );
}
