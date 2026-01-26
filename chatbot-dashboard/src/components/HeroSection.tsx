// src/components/HeroSection.tsx
'use client';

import { useEffect, useRef, JSX } from 'react';
import { motion } from 'framer-motion';
import { track } from "@/lib/metaPixel";
import { FaWhatsapp, FaCalendarAlt, FaBullseye, FaBrain } from "react-icons/fa";


export default function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((e) => {
        console.error('Video no se puede reproducir automáticamente:', e);
      });
    }
  }, []);

  return (
    <section className="relative bg-black h-[100svh] md:h-screen text-white overflow-hidden flex items-center justify-center px-6 font-sans">
      {/* 🎥 Video de fondo */}
      <video
        ref={videoRef}
        src="/video-assistant.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      />

      {/* 🌑 Overlay con degradado */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/50 to-transparent z-0" />

      {/* 🌟 Hero Content */}
      <motion.div
        className="z-10 text-center max-w-3xl w-full"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        {/* Tag superior (posicionamiento) */}
        <div className="mx-auto mb-5 inline-flex items-center gap-2 bg-white/10 border border-white/15 backdrop-blur-md px-4 py-2 rounded-full text-xs text-white/85">
          <FaBrain className="text-purple-300" />
          IA conversacional avanzada • Omnicanal • Enfocada en conversión
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold mb-5 tracking-tight leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]">
          Convierte mensajes en ventas con{" "}
          <span className="text-violet-400">IA que entiende contexto</span>
          <br className="hidden md:block" />
          y responde <span className="text-violet-400">24/7</span>
        </h1>

        <p className="text-lg md:text-xl text-white/90 mb-7 leading-relaxed drop-shadow">
          Aamy responde en WhatsApp, Instagram y Facebook con{" "}
          <strong>contexto</strong>, detecta <strong>intención de compra</strong>, y si el cliente se enfría,{" "}
          <strong>hace seguimiento automático</strong> para recuperarlo.
        </p>

        {/* Bullet grid (4 puntos premium, compactos) */}
        <div className="mx-auto mb-7 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl">
          <HeroBullet
            icon={<FaWhatsapp className="text-green-300" />}
            title="Omnicanal real"
            desc="WhatsApp, Instagram y Facebook en un solo sistema."
          />
          <HeroBullet
            icon={<FaBullseye className="text-pink-300" />}
            title="Pixel + CAPI"
            desc="Eventos desde conversaciones para optimizar campañas."
          />
          <HeroBullet
            icon={<FaCalendarAlt className="text-blue-300" />}
            title="Agendamiento"
            desc="Conecta Google Calendar para confirmar citas reales."
          />
          <HeroBullet
            icon={<FaBrain className="text-purple-300" />}
            title="IA con intención"
            desc="Respuestas precisas orientadas a cierre (no genéricas)."
          />
        </div>

        {/* Micro-clarificación (evitar objeción sin sonar limitado) */}
        <div className="mx-auto mb-4 max-w-3xl text-sm text-white/80">
          <span className="font-semibold text-white">No es un bot de respuestas.</span>{" "}
          Aamy usa la información de tu negocio y el contexto del chat para responder con precisión, y{" "}
          <span className="font-semibold text-white">puedes intervenir cuando quieras</span>.
        </div>

        {/* Precio visible */}
        <div className="mb-2 text-white/85 text-sm">
          <span className="font-semibold text-white">$399 USD</span> instalación (incluye el primer mes) ·{" "}
          <span className="font-semibold text-white">$199 USD</span>/mes desde el mes 2
        </div>

        <div className="mb-6 text-white/70 text-xs">
          Tip: Con recuperar <span className="font-semibold text-white">un solo cliente al mes</span>, Aamy normalmente{" "}
          <span className="font-semibold text-white">se paga sola</span>.
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="/login"
            onClick={() => track("Lead", { content_name: "CTA Activar Aamy (Hero)" })}
            className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-4 rounded-full font-bold text-lg shadow-lg transition-all duration-300 transform hover:scale-[1.03]"
          >
            Activar Aamy ahora
          </a>

        </div>

        <p className="mt-4 text-white/60 text-xs md:text-sm">
          Configuración guiada con tu información. Cancelas cuando quieras.
        </p>
      </motion.div>
    </section>
  );
}

function HeroBullet({
  icon,
  title,
  desc,
}: {
  icon: JSX.Element;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md text-left">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-white/70 mt-1">{desc}</p>
      </div>
    </div>
  );
}
