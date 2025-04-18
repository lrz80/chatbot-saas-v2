"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function VerifiedPage() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push("/login");
    }, 5000); // redirige tras 5 segundos
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-6">
      <div className="max-w-md w-full bg-white/10 border border-white/20 p-8 rounded-xl text-center">
        <h1 className="text-2xl font-bold text-green-400 mb-4">✅ ¡Cuenta verificada!</h1>
        <p className="text-white/80 text-sm mb-2">
          Tu cuenta ha sido activada exitosamente. Puedes iniciar sesión ahora.
        </p>
        <p className="text-white/50 text-xs">Redirigiendo al login en 5 segundos...</p>
      </div>
    </div>
  );
}
