// src/app/auth/verify-email/page.tsx

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { BACKEND_URL } from "@/utils/api";

function VerificacionContenido() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("error");
        return;
      }

      try {
        const res = await fetch(`${BACKEND_URL}/auth/verify-email?token=${token}`);
        if (!res.ok) throw new Error("Token inválido");
        setStatus("success");
        setTimeout(() => router.push("/login"), 5000);
      } catch (err) {
        console.error("❌ Error al verificar email:", err);
        setStatus("error");
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-6">
      <div className="max-w-md w-full bg-white/10 border border-white/20 p-8 rounded-xl text-center">
        {status === "loading" && <p>Verificando tu cuenta...</p>}
        {status === "success" && (
          <>
            <h1 className="text-2xl font-bold text-green-400 mb-4">✅ ¡Cuenta verificada!</h1>
            <p className="text-white/80 text-sm">Tu cuenta ha sido activada exitosamente.</p>
            <p className="text-white/50 text-xs mt-2">Redirigiendo al login en 5 segundos...</p>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="text-2xl font-bold text-red-400 mb-4">❌ Verificación fallida</h1>
            <p className="text-white/80 text-sm">El enlace no es válido o ha expirado.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-white text-center mt-10">Cargando...</div>}>
      <VerificacionContenido />
    </Suspense>
  );
}
