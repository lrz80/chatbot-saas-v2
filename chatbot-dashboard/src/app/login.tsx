"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("https://chatbot-backend-production-5c39.up.railway.app/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || "Error del servidor");
      }

      const data = JSON.parse(text);
      if (!data.token) {
        throw new Error("Token no recibido");
      }

      // ✅ Guardamos token (opcional: usar cookies seguras o localStorage)
      localStorage.setItem("token", data.token);

      // 🚀 Redirigir al dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error("❌ Error login:", err);
      setError("Error al iniciar sesión. Verifica tu correo y contraseña.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
      <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl w-full max-w-md border border-white/10 shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h1>

        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 placeholder-white/60"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 placeholder-white/60"
            required
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 rounded-lg hover:brightness-110 transition"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
