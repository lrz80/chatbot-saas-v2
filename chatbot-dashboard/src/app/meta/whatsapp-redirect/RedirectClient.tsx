"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

export default function RedirectClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    // 1) Log de todo lo que llega desde Meta
    const all = Object.fromEntries(sp.entries());
    console.log("[WA REDIRECT] ALL PARAMS:", all);

    // 2) Estos son los que nos interesan (Meta suele enviar estos)
    const wabaId = sp.get("waba_id");
    const phoneNumberId = sp.get("phone_number_id");

    console.log("[WA REDIRECT] parsed:", { wabaId, phoneNumberId });

    if (!wabaId || !phoneNumberId) {
      console.error("[WA REDIRECT] Missing waba_id or phone_number_id", all);
      setStatus("error");
      return;
    }

    const run = async () => {
      try {
        console.log("[WA REDIRECT] POST onboard-complete ->", {
          url: `${API_BASE}/api/meta/whatsapp/onboard-complete`,
          wabaId,
          phoneNumberId,
        });

        const res = await fetch(`${API_BASE}/api/meta/whatsapp/onboard-complete`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wabaId, phoneNumberId }),
        });

        const data = await res.json();
        console.log("[WA REDIRECT] onboard-complete result:", res.status, data);

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
