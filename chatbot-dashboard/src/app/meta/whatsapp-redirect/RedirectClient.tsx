"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function RedirectClient() {
  const sp = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const code = sp.get("code") || "";
    const state = sp.get("state") || "";

    const error = sp.get("error") || "";
    const errorReason = sp.get("error_reason") || "";
    const errorDescription = sp.get("error_description") || "";

    console.log("[WA REDIRECT] params:", {
      hasCode: !!code,
      state,
      error,
      errorReason,
      errorDescription,
    });

    // 1) Si hay opener, manda el resultado al dashboard y cierra el popup
    try {
      if (window.opener && !window.opener.closed) {
        if (code) {
          window.opener.postMessage(
            { type: "WA_EMBEDDED_SIGNUP_CODE", code, state },
            "*"
          );
        } else {
          window.opener.postMessage(
            {
              type: "WA_EMBEDDED_SIGNUP_ERROR",
              state,
              error: error || "missing_code",
              errorReason,
              errorDescription,
            },
            "*"
          );
        }
        window.close();
        return;
      }
    } catch (e) {
      // ignore y cae al fallback
    }

    // 2) Fallback: si no hay opener, manda a /dashboard/training con query
    const qs = new URLSearchParams();
    if (code) qs.set("wa_code", code);
    if (state) qs.set("wa_state", state);

    if (!code) {
      qs.set("wa_error", error || "missing_code");
      if (errorReason) qs.set("wa_error_reason", errorReason);
      if (errorDescription) qs.set("wa_error_description", errorDescription);
    }

    router.replace(`/dashboard/training?${qs.toString()}`);
  }, [sp, router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <p>Finalizando conexión con WhatsApp…</p>
    </div>
  );
}
