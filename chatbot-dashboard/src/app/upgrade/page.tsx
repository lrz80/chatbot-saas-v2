"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";

export default function UpgradePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Acceso restringido - Amy AI";
  }, []);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/stripe/checkout`, {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("❌ No se pudo iniciar el pago.");
        setLoading(false);
      }
    } catch (error) {
      console.error("❌ Error al conectar con Stripe:", error);
      alert("Error al conectar con el sistema de pagos.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#1f1f1f] to-[#0a0a0a] text-white px-4">
      <div className="backdrop-blur-md border border-white/20 bg-white/10 p-10 rounded-2xl shadow-xl max-w-md w-full text-center">
        <div className="text-5xl mb-4 text-yellow-400">🚫</div>
        <h1 className="text-2xl font-bold text-yellow-300 mb-2">Acceso restringido</h1>
        <p className="text-white/70 mb-6">
          Para usar el panel necesitas tener una <strong>membresía activa</strong>.
        </p>
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 px-4 rounded-lg transition duration-300 disabled:opacity-50"
        >
          {loading ? "Redirigiendo a Stripe..." : "Activar Membresía"}
        </button>
      </div>
    </div>
  );
}
