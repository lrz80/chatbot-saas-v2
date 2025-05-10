// src/app/verify/page.tsx

'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/utils/api";

export default function VerifyEmailPage() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const storedEmail = localStorage.getItem("pending_email");
        if (!storedEmail) {
          router.push("/login");
        } else {
          setEmail(storedEmail);
        }
      }
    } catch (err) {
      console.warn("⚠️ No se pudo acceder a localStorage:", err);
      router.push("/login");
    }
  }, [router]);

  const handleVerify = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${BACKEND_URL}/auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, codigo: code }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Verificación fallida");

      alert("✅ Correo verificado correctamente");
      try {
        localStorage.removeItem("pending_email");
      } catch (err) {
        console.warn("⚠️ No se pudo limpiar localStorage:", err);
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <div className="bg-white/10 border border-white/20 p-8 rounded-xl shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-4 text-purple-300">
          Verifica tu Correo
        </h2>

        <p className="mb-4 text-white/70 text-sm text-center">
          Ingresa el código de 6 dígitos que enviamos a tu correo.
        </p>

        {error && (
          <p className="text-red-500 bg-red-100 rounded p-2 text-sm mb-4">
            {error}
          </p>
        )}

        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Ej: 123456"
          maxLength={6}
          className="w-full p-3 mb-4 rounded bg-white/10 border border-white/20 text-white placeholder-white/60 text-center text-xl tracking-widest"
        />

        <button
          onClick={handleVerify}
          disabled={loading || code.length !== 6}
          className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-semibold disabled:opacity-50"
        >
          {loading ? "Verificando..." : "Verificar"}
        </button>

        <button
          onClick={async () => {
            const res = await fetch(`${BACKEND_URL}/auth/resend-code`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (res.ok) {
              alert("✅ Código reenviado a tu correo");
            } else {
              alert(data.error || "No se pudo reenviar el código");
            }
          }}
          className="w-full mt-4 text-sm text-purple-300 hover:underline text-center"
        >
          ¿No recibiste el código? Reenviar
        </button>
      </div>
    </div>
  );
}
