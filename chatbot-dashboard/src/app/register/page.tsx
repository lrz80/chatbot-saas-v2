"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaRobot,
  FaChartBar,
  FaWhatsapp,
  FaFacebookMessenger,
  FaInstagram,
  FaMicrophoneAlt,
  FaBullhorn,
} from "react-icons/fa";

const nodos = [
  { icon: <FaRobot size={36} style={{ color: '#a855f7' }} />, title: 'Atenci\u00f3n 24/7', desc: 'Siempre online para tu negocio.', posClass: 'top-[5%] left-[10%]', x: 10, y: 5 },
  { icon: <FaChartBar size={36} style={{ color: '#6366f1' }} />, title: 'Estad\u00edsticas', desc: 'Panel con rendimiento en tiempo real.', posClass: 'top-[5%] right-[10%]', x: 90, y: 5 },
  { icon: <FaWhatsapp size={36} style={{ color: '#25D366' }} />, title: 'WhatsApp', desc: 'Responde mensajes autom\u00e1ticamente.', posClass: 'top-[50%] left-[2%]', x: 2, y: 50 },
  { icon: <FaFacebookMessenger size={36} style={{ color: '#0084FF' }} />, title: 'Facebook', desc: 'Chatbot conectado a tu fanpage.', posClass: 'top-[50%] right-[2%]', x: 98, y: 50 },
  { icon: <FaInstagram size={36} style={{ color: '#E1306C' }} />, title: 'Instagram DM', desc: 'Atiende tus DMs con IA.', posClass: 'bottom-[20%] left-[15%]', x: 15, y: 80 },
  { icon: <FaMicrophoneAlt size={36} style={{ color: '#6366f1' }} />, title: 'Voz AI', desc: 'Responde llamadas como un humano.', posClass: 'bottom-[20%] right-[15%]', x: 85, y: 80 },
  { icon: <FaBullhorn size={36} style={{ color: '#facc15' }} />, title: 'Campa\u00f1as', desc: 'Marketing automatizado y efectivo.', posClass: 'bottom-[5%] left-[40%]', x: 40, y: 95 },
];

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || "Error del servidor");

      const data = JSON.parse(text);
      if (!data.token) throw new Error("Token no recibido");

      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("\u274c Error al registrar:", error);
      setError("Error al crear la cuenta. Verifica los datos.");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black text-white px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/30 to-black z-0" />

      <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        {nodos.map((nodo, index) => (
          <line
            key={index}
            x1="50%"
            y1="50%"
            x2={`${nodo.x}%`}
            y2={`${nodo.y}%`}
            stroke="white"
            strokeOpacity="0.15"
            strokeWidth="2"
          />
        ))}
      </svg>

      <div className="absolute inset-0 z-10">
        {nodos.map((nodo, index) => (
          <div
            key={index}
            className={`absolute ${nodo.posClass} bg-white/5 border border-white/10 p-4 rounded-xl w-60 backdrop-blur-md shadow-lg hover:scale-105 transition-transform`}
          >
            <div className="flex items-center gap-3 mb-2">
              {nodo.icon}
              <span className="text-white text-base font-semibold">{nodo.title}</span>
            </div>
            <p className="text-sm text-white/60">{nodo.desc}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleRegister} className="relative z-20 w-full max-w-md bg-white/10 border border-white/20 backdrop-blur-md text-white rounded-2xl p-8 shadow-2xl space-y-4">
        <h2 className="text-2xl font-bold text-center text-purple-300">Crear cuenta</h2>

        {error && <p className="bg-red-100 text-red-700 p-2 rounded text-sm text-center">{error}</p>}

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
          placeholder="Correo electr\u00f3nico"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 rounded bg-white/10 placeholder-white/70 border border-white/20"
        />

        <input
          name="telefono"
          type="tel"
          placeholder="Tel\u00e9fono (ej: +14120000000)"
          value={formData.telefono}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 rounded bg-white/10 placeholder-white/70 border border-white/20"
        />

        <input
          name="password"
          type="password"
          placeholder="Contrase\u00f1a segura"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 rounded bg-white/10 placeholder-white/70 border border-white/20"
        />

        <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg font-semibold transition duration-200">
          Registrarse
        </button>

        <p className="text-center text-sm text-white/60 mt-2">
          \u00bfYa tienes cuenta?{' '}
          <a href="/login" className="text-purple-400 hover:text-purple-300 underline">
            Inicia sesi\u00f3n
          </a>
        </p>
      </form>
    </div>
  );
}
