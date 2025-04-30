// src/components/HeroSection.tsx
'use client';

import { useEffect, useRef } from 'react';

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
    <section className="relative bg-black min-h-screen text-white overflow-hidden flex flex-col items-center justify-end pb-20">
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

      {/* 🌑 Overlay para contraste */}
      <div className="absolute inset-0 bg-black/50 z-0" />

      {/* 🌟 Hero Content */}
      <div className="z-10 text-center px-6 max-w-3xl animate-fade-up">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight leading-tight drop-shadow-md">
          Conoce a <span className="text-violet-400">Amy</span> — Tu Asistente AI 24/7
        </h1>

        <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed drop-shadow">
          Automatiza llamadas, respuestas en WhatsApp, Instagram, Facebook y tus Campañas de Marketing.
          Mejora tu atención al cliente con una asistente inteligente, natural y siempre disponible.
        </p>

        {/* CTA Mejorado */}
        <a
          href="/login"
          className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-4 rounded-full font-bold text-lg shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          Probar Amy AI Gratis
        </a>
      </div>
    </section>
  );
}
