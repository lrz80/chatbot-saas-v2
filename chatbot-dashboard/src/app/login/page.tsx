'use client';

import { BACKEND_URL } from '@/utils/api';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaRobot,
  FaChartBar,
  FaWhatsapp,
  FaFacebookMessenger,
  FaInstagram,
  FaMicrophoneAlt,
  FaBullhorn,
} from 'react-icons/fa';

const nodos = [
  { icon: <FaRobot size={36} style={{ color: '#a855f7' }} />, title: 'Atención 24/7', desc: 'Siempre online para tu negocio.', posClass: 'top-[5%] left-[10%]', x: 10, y: 5 },
  { icon: <FaChartBar size={36} style={{ color: '#6366f1' }} />, title: 'Estadísticas', desc: 'Panel con rendimiento en tiempo real.', posClass: 'top-[5%] right-[10%]', x: 90, y: 5 },
  { icon: <FaWhatsapp size={36} style={{ color: '#25D366' }} />, title: 'WhatsApp', desc: 'Responde mensajes automáticamente.', posClass: 'top-[50%] left-[2%]', x: 2, y: 50 },
  { icon: <FaFacebookMessenger size={36} style={{ color: '#0084FF' }} />, title: 'Facebook', desc: 'Chatbot conectado a tu fanpage.', posClass: 'top-[50%] right-[2%]', x: 98, y: 50 },
  { icon: <FaInstagram size={36} style={{ color: '#E1306C' }} />, title: 'Instagram DM', desc: 'Atiende tus DMs con IA.', posClass: 'bottom-[20%] left-[15%]', x: 15, y: 80 },
  { icon: <FaMicrophoneAlt size={36} style={{ color: '#6366f1' }} />, title: 'Voz AI', desc: 'Responde llamadas como un humano.', posClass: 'bottom-[20%] right-[15%]', x: 85, y: 80 },
  { icon: <FaBullhorn size={36} style={{ color: '#facc15' }} />, title: 'Campañas', desc: 'Marketing automatizado y efectivo.', posClass: 'bottom-[5%] left-[40%]', x: 40, y: 95 },
];

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResendSuccess(false);

    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (err) {
        setError('Error al interpretar la respuesta del servidor');
        return;
      }

      if (res.status === 403) {
        setError("Tu cuenta aún no está verificada. Revisa tu correo.");
        setShowResend(true);
        return;
      }

      if (!res.ok) {
        setError(`Error HTTP: ${res.status}`);
        return;
      }

      if (!data.uid) {
        setError('UID no recibido del servidor');
        return;
      }

      localStorage.setItem('uid', data.uid);
      await new Promise((r) => setTimeout(r, 100));
      router.push('/dashboard');

    } catch (err: any) {
      setError(err.message || 'Error desconocido al iniciar sesión');
    }
  };

  const reenviarLink = async () => {
    if (cooldown > 0) return;
    setError('');

    try {
      const res = await fetch(`${BACKEND_URL}/auth/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'No se pudo reenviar el enlace');
        return;
      }

      setResendSuccess(true);
      setShowResend(false);
      setCooldown(60);
    } catch (err) {
      setError('Error al reenviar el correo de verificación');
    }
  };

  if (!mounted) return null;

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

      <div className="relative z-20 w-full max-w-md bg-white/10 border border-white/20 backdrop-blur-md text-white rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-purple-300 drop-shadow">
          Iniciar sesión
        </h1>

        {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm text-center">{error}</p>}

        {showResend && (
          <div className="text-center mb-4">
            <button
              onClick={reenviarLink}
              disabled={cooldown > 0}
              className="text-purple-300 hover:underline text-sm disabled:opacity-50"
            >
              {cooldown > 0
                ? `Espera ${cooldown}s para reenviar`
                : '¿No recibiste el correo? Reenviar link de activación'}
            </button>
          </div>
        )}

        {resendSuccess && (
          <p className="text-green-400 text-sm mt-2 text-center">
            ✅ Enlace de verificación reenviado a tu correo.
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1 text-white/80">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-white/80">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition text-white font-semibold shadow-lg"
          >
            Ingresar
          </button>
        </form>

        <p className="text-center text-sm mt-3">
          <a
            href="/forgot-password"
            className="text-white/70 hover:underline hover:text-white transition"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </p>

        <p className="mt-6 text-sm text-center text-white/60">
          ¿Aún no tienes cuenta?{' '}
          <a href="/register" className="text-purple-400 underline hover:text-purple-300 transition">
            Regístrate
          </a>
        </p>
      </div>
    </div>
  );
}
