"use client";

import { useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${BACKEND_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al solicitar recuperación");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/20 max-w-md w-full">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Recuperar contraseña</h2>
        {success ? (
          <p className="text-green-400 text-center">
            ✅ Te hemos enviado un enlace de recuperación si el correo está registrado.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Tu correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 rounded border border-white/20 bg-white/10 text-white placeholder-white/60"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition"
            >
              {loading ? "Enviando..." : "Enviar enlace de recuperación"}
            </button>
          </form>
        )}
        <p className="text-center text-sm mt-4 text-white/70">
          <a href="/login" className="hover:underline hover:text-white">Volver al inicio de sesión</a>
        </p>
      </div>
    </div>
  );
}
