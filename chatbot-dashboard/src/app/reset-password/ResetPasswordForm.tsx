"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BACKEND_URL } from "@/utils/api";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Token inválido o ausente");
      setTimeout(() => router.push("/login"), 3000);
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${BACKEND_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setError("El enlace ha expirado. Serás redirigido al inicio de sesión.");
          setTimeout(() => router.push("/login"), 3000);
          return;
        }
        throw new Error(data.error || "Error al restablecer contraseña");
      }

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
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Restablecer contraseña</h2>

        {success ? (
          <p className="text-green-400 text-center">
            ✅ Contraseña actualizada correctamente. <br /> Puedes iniciar sesión nuevamente.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 rounded border border-white/20 bg-white/10 text-white placeholder-white/60"
            />
            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full p-3 rounded border border-white/20 bg-white/10 text-white placeholder-white/60"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition"
            >
              {loading ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </form>
        )}

        <p className="text-center text-sm mt-4 text-white/70">
          <a href="/login" className="hover:underline hover:text-white">
            Volver al inicio de sesión
          </a>
        </p>
      </div>
    </div>
  );
}
