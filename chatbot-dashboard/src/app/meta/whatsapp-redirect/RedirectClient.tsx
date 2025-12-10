"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BACKEND_URL } from "@/utils/api";

export default function RedirectClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] =
    useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    // 1) Ver TODOS los parámetros que llegan de Meta
    const allParams = Object.fromEntries(searchParams.entries());
    console.log("[WA REDIRECT] Query params:", allParams);

    // OJO: estos nombres los vamos a ajustar DESPUÉS de ver el console.log
    const wabaId =
      searchParams.get("waba_id") || searchParams.get("wa_waba_id");
    const phoneNumberId =
      searchParams.get("phone_number_id") ||
      searchParams.get("wa_phone_number_id");

    if (!wabaId || !phoneNumberId) {
      console.error("[WA REDIRECT] Falta wabaId o phoneNumberId", {
        wabaId,
        phoneNumberId,
      });
      setStatus("error");
      return;
    }

    const save = async () => {
      try {
        console.log("[WA REDIRECT] Enviando a onboard-complete…", {
          wabaId,
          phoneNumberId,
        });

        const res = await fetch(
          `${BACKEND_URL}/api/meta/whatsapp/onboard-complete`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wabaId, phoneNumberId }),
          }
        );

        const data = await res.json();
        console.log(
          "[WA REDIRECT] Respuesta onboard-complete:",
          res.status,
          data
        );

        if (!res.ok || !data?.ok) {
          setStatus("error");
          return;
        }

        setStatus("ok");

        // Redirigir al dashboard
        router.push("/dashboard/training?whatsapp=connected");
      } catch (err) {
        console.error(
          "[WA REDIRECT] Error llamando onboard-complete:",
          err
        );
        setStatus("error");
      }
    };

    save();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      {status === "loading" && (
        <p>Procesando registro de WhatsApp…</p>
      )}
      {status === "ok" && (
        <p>WhatsApp conectado. Redirigiendo…</p>
      )}
      {status === "error" && (
        <p>
          Ocurrió un error procesando el registro de WhatsApp. Revisa la
          consola del navegador.
        </p>
      )}
    </div>
  );
}
