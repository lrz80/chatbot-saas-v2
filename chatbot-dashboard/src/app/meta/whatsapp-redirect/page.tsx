// src/app/meta/whatsapp-redirect/page.tsx
"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BACKEND_URL } from "@/utils/api";

function WhatsappRedirectInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Tomamos TODOS los parámetros para depurar si hace falta
    const allParams = Object.fromEntries(searchParams.entries());
    console.log("[WA REDIRECT] Query params recibidos:", allParams);

    const payload = {
      // Intentamos mapear varios nombres posibles
      waba_id:
        searchParams.get("wa_waba_id") ||
        searchParams.get("waba_id") ||
        null,
      phone_number:
        searchParams.get("wa_phone_number") ||
        searchParams.get("phone_number") ||
        null,
      phone_number_id:
        searchParams.get("wa_phone_number_id") ||
        searchParams.get("phone_number_id") ||
        null,
      business_id:
        searchParams.get("wa_business_id") ||
        searchParams.get("business_id") ||
        null,
      sender:
        searchParams.get("wa_sender") ||
        searchParams.get("sender") ||
        null,

      // Guardamos crudo todo por si hay algo que falte mapear
      raw: allParams,
    };

    // Disparamos al backend y luego volvemos al dashboard
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/meta/whatsapp-onboard`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json().catch(() => ({}));
        console.log("[WA REDIRECT] Respuesta backend:", res.status, json);
      } catch (err) {
        console.error("[WA REDIRECT] Error enviando al backend:", err);
      } finally {
        router.replace("/dashboard/training?whatsapp=connected");
      }
    })();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-700 text-center max-w-md">
        <h1 className="font-semibold text-lg mb-2">
          Conectando tu WhatsApp Business…
        </h1>
        <p className="text-sm opacity-80">
          Estamos guardando la configuración de tu número oficial. Este proceso
          puede tardar unos segundos. No cierres esta ventana.
        </p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Procesando conexión de WhatsApp…</div>}>
      <WhatsappRedirectInner />
    </Suspense>
  );
}
