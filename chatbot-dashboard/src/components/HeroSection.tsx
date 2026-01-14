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
      <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/45 to-transparent z-0" />

      {/* 🌟 Hero Content animado */}
      <motion.div
        className="z-10 text-center max-w-2xl w-full"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <h1 className="text-4xl md:text-5xl font-extrabold mb-5 tracking-tight leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
          No pierdas ventas por no responder a tiempo.
          <br />
          Atención automática <span className="text-violet-400">24/7</span>
        </h1>

        <p className="text-lg md:text-xl text-white/90 mb-6 leading-relaxed drop-shadow">
          Cada mensaje sin responder es una venta perdida.{' '}
          <strong>Aamy responde en segundos</strong> y convierte mensajes en clientes por{' '}
          <strong>WhatsApp, Instagram y Facebook</strong>.  
          Si el cliente no responde, <strong>Aamy hace seguimiento automático</strong> hasta recuperarlo.
        </p>

        {/* Micro “qué NO es” (reduce objeciones y malos fit) */}
        <div className="mx-auto mb-4 max-w-2xl text-sm text-white/80">
          <span className="font-semibold text-white">No es un bot genérico.</span>{' '}
          Aamy no inventa respuestas ni improvisa.  
          Responde solo con la información real de tu negocio y{' '}
          <span className="font-semibold text-white">te permite intervenir cuando quieras.</span>
        </div>

        {/* Precio visible (sin tabla) */}
        <div className="mb-2 text-white/85 text-sm">
          <span className="font-semibold text-white">$399 USD</span> instalación (incluye el primer mes) ·{" "}
          <span className="font-semibold text-white">$199 USD</span>/mes desde el mes 2
        </div>

        <div className="mb-5 text-white/70 text-xs">
          💡 Con recuperar <span className="font-semibold text-white">un solo cliente al mes</span>, 
          Aamy normalmente <span className="font-semibold text-white">se paga sola</span>.
        </div>

        <div className="flex justify-center">
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
