// src/components/HeroSection.tsx
'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

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
    <section className="relative bg-black min-h-screen text-white overflow-hidden flex flex-col items-center justify-end pb-20 font-sans">
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
      <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/45 to-transparent z-0" />

      {/* 🌟 Hero Content animado */}
      <motion.div
        className="z-10 text-center px-6 max-w-3xl"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight drop-shadow-[0_2px_8px_rgba(138,43,226,0.4)]">
          No pierdas ventas por no responder a tiempo.
          <br />
          Atención automática <span className="text-violet-400">24/7</span>
        </h1>

        <p className="text-lg md:text-xl text-white/90 mb-6 leading-relaxed drop-shadow">
          Aamy responde en segundos las preguntas y convierte mensajes en leads por{' '}
          <strong>WhatsApp, Instagram y Facebook</strong>. Si el cliente no responde, hace{' '}
          <strong>seguimiento automático</strong> para recuperarlo.
        </p>

        {/* Micro “qué NO es” (reduce objeciones y malos fit) */}
        <div className="mx-auto mb-6 max-w-2xl text-sm md:text-base text-white/80">
          <span className="font-semibold text-white">No es</span> un bot genérico que inventa información.
          <br />
          Responde con lo que tú defines (servicios, horarios, ubicación, FAQs) y te deja intervenir cuando quieras.
        </div>

        {/* Precio visible (sin tabla) */}
        <div className="mb-8 text-white/85 text-sm md:text-base">
          <span className="font-semibold text-white">$399</span> instalación (incluye el primer mes) ·{' '}
          <span className="font-semibold text-white">$199</span>/mes desde el mes 2
        </div>

        {/* Lógica económica (sin promesa) */}
        <div className="mb-4 text-white/70 text-xs md:text-sm">
          💡 Un solo cliente recuperado al mes suele pagar el servicio.
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/login"
            className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-4 rounded-full font-bold text-lg shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            Activar Aamy 24/7
          </a>
        </div>

        <p className="mt-4 text-white/60 text-xs md:text-sm">
          Configuración guiada con tu información. Cancelas cuando quieras.
        </p>
      </motion.div>
    </section>
  );
}
