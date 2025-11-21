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
    const waWabaId = searchParams.get("wa_waba_id");
    const waPhoneNumberId = searchParams.get("wa_phone_number_id");
    const businessId = searchParams.get("waba_business_id") || searchParams.get("business_id");
    const tenantId = searchParams.get("state"); // el ID que tú enviaste

    console.log("🔁 Callback params:", {
      waWabaId,
      waPhoneNumberId,
      businessId,
      tenantId,
    });

    if (!waWabaId || !waPhoneNumberId || !tenantId) {
      setStatus("error");
      setMessage(
        "Meta no devolvió los datos necesarios. Cierra esta ventana e inténtalo de nuevo."
      );
      return;
    }

    const run = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/meta/whatsapp/onboard-complete`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId,
            waWabaId,
            waPhoneNumberId,
            businessId,
          }),
        });

        const json = await res.json().catch(() => ({}));
        console.log("💾 Backend response:", res.status, json);

        if (!res.ok) {
          setStatus("error");
          setMessage(json?.error || "Error guardando datos en Aamy.");
          return;
        }

        setStatus("ok");
        setMessage("WhatsApp conectado correctamente. Regresando al dashboard...");

        setTimeout(() => {
          router.replace("/dashboard/training");
        }, 2000);
      } catch (err) {
        console.error("❌ Error conectando con el backend:", err);
        setStatus("error");
        setMessage("Error de red. Cierra esta ventana e inténtalo de nuevo.");
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
          <p className="text-sm text-white/60">No cierres esta ventana…</p>
        )}
      </div>
    </div>
  );
}
