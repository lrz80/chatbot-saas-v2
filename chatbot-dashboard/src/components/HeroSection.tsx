// src/components/HeroSection.tsx
'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((e) => {
        console.error("Video no se puede reproducir automáticamente:", e);
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
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-transparent z-0" />

      {/* 🌟 Hero Content animado */}
      <motion.div
        className="z-10 text-center px-6 max-w-3xl"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight drop-shadow-[0_2px_8px_rgba(138,43,226,0.4)]">
          Conoce a <span className="text-violet-400">Amy</span> — Tu Asistente AI 24/7
        </h1>

        <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed drop-shadow">
          Automatiza llamadas, WhatsApp, Instagram, Facebook y campañas de Marketing SMS/Email. Amy responde por ti 24/7 con IA natural y poderosa.
        </p>

        <a
          href="/register"
          className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-4 rounded-full font-bold text-lg shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          Probar Amy AI Gratis
        </a>

        <a
          href="#benefits"
          className="mt-4 block text-purple-300 text-sm hover:underline"
        >
          Ver cómo funciona
        </a>
      </motion.div>
    </section>
  );
}
