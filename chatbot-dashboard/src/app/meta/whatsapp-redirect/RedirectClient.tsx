// src/app/meta/whatsapp-redirect/RedirectClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

/**
 * Cloud API + Embedded Signup (OAuth response_type=code)
 *
 * Meta NO envía waba_id / phone_number_id en el redirect.
 * Envía un ?code=... que debemos mandar al backend para:
 * 1) exchange code -> access_token
 * 2) descubrir WABA(s)
 * 3) listar phone_numbers
 * 4) guardar whatsapp_business_id + whatsapp_phone_number_id en DB
 */
export default function RedirectClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    const all = Object.fromEntries(sp.entries());
    console.log("[WA REDIRECT] ALL PARAMS:", all);

    const code = sp.get("code");
    const state = sp.get("state");
    const error = sp.get("error");
    const errorDescription = sp.get("error_description");

    if (error) {
      console.error("[WA REDIRECT] Meta error:", { error, errorDescription, all });
      setStatus("error");
      return;
    }

    if (!code) {
      console.error("[WA REDIRECT] Missing `code` in redirect params:", all);
      setStatus("error");
      return;
    }

    const run = async () => {
      try {
        console.log("[WA REDIRECT] POST exchange-code ->", {
          url: `${API_BASE}/api/meta/whatsapp/exchange-code`,
          hasCode: true,
          state,
        });

        const res = await fetch(`${API_BASE}/api/meta/whatsapp/exchange-code`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, state }),
        });

        const data = await res.json().catch(() => null);
        console.log("[WA REDIRECT] exchange-code result:", res.status, data);

        if (!res.ok || !data?.ok) {
          setStatus("error");
          return;
        }

        setStatus("ok");
        router.replace("/dashboard/training?whatsapp=connected");
      } catch (e) {
        console.error("[WA REDIRECT] exception:", e);
        setStatus("error");
      }
    };

    run();
  }, [sp, router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      {status === "loading" && <p>Procesando Embedded Signup…</p>}
      {status === "ok" && <p>WhatsApp conectado. Redirigiendo…</p>}
      {status === "error" && <p>Error en redirect. Revisa consola.</p>}
    </div>
  );
}
