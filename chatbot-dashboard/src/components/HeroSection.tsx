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

        {/* CTA */}
        <a
          href="/register"
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-xl hover:scale-105 hover:brightness-110 transition-all duration-300"
        >
          Comenzar con Amy AI
        </a>
      </div>
    </section>
  );
}
