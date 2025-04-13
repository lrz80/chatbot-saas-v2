"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    password: "",
  });
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("https://chatbot-backend-production-5c39.up.railway.app/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(text || "Error del servidor");
      }

      const data = JSON.parse(text);
      if (!data.token) throw new Error("Token no recibido");

      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("❌ Error al registrar:", error);
      setError("Error al crear la cuenta. Verifica los datos.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center px-4">
      <form
        onSubmit={handleRegister}
        className="bg-white/5 border border-white/10 backdrop-blur-md p-8 rounded-xl shadow-lg w-full max-w-md space-y-4 text-white"
      >
        <h2 className="text-2xl font-bold text-center text-purple-400">Crear cuenta</h2>

        {error && (
          <p className="text-red-400 bg-red-950 border border-red-600 p-2 rounded text-sm text-center">
            {error}
          </p>
        )}

        <div className="flex gap-4">
          <input
            name="nombre"
            type="text"
            placeholder="Nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded bg-white/10 placeholder-white/70 border border-white/20"
          />
          <input
            name="apellido"
            type="text"
            placeholder="Apellido"
            value={formData.apellido}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded bg-white/10 placeholder-white/70 border border-white/20"
          />
        </div>

        <input
          name="email"
          type="email"
          placeholder="Correo electrónico"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 rounded bg-white/10 placeholder-white/70 border border-white/20"
        />

        <input
          name="telefono"
          type="tel"
          placeholder="Número de teléfono (ej: +14120000000)"
          value={formData.telefono}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 rounded bg-white/10 placeholder-white/70 border border-white/20"
        />

        <input
          name="password"
          type="password"
          placeholder="Contraseña segura"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 rounded bg-white/10 placeholder-white/70 border border-white/20"
        />

        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg font-semibold transition duration-200"
        >
          Registrarse
        </button>

        <p className="text-center text-sm text-white/60 mt-2">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="text-purple-400 hover:text-purple-300 underline">
            Inicia sesión
          </a>
        </p>
      </form>
    </div>
  );
}
