// src/app/upgrade/page.tsx

"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UpgradePage() {
  const router = useRouter();

  useEffect(() => {
    document.title = "Acceso restringido - Amy AI";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#1f1f1f] to-[#0a0a0a] text-white px-4">
      <div className="backdrop-blur-md border border-white/20 bg-white/10 p-10 rounded-2xl shadow-xl max-w-md w-full text-center">
        <div className="text-5xl mb-4 text-yellow-400">🚫</div>
        <h1 className="text-2xl font-bold text-yellow-300 mb-2">Acceso restringido</h1>
        <p className="text-white/70 mb-6">
          Para usar el panel necesitas tener una <strong>membresía activa</strong>.
        </p>
        <button
          onClick={() => router.push("/api/stripe/checkout")}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
        >
          Ir al pago con Stripe
        </button>
      </div>
    </div>
  );
}
