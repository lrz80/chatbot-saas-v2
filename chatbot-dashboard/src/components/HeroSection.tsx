// src/components/HeroSection.tsx
'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FaWhatsapp,
  FaFacebookMessenger,
  FaInstagram,
  FaMicrophoneAlt,
  FaBullhorn,
} from 'react-icons/fa';

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
    <section
      className="relative bg-black min-h-screen text-white overflow-hidden flex flex-col items-center justify-end pb-24 font-sans"
      aria-label="Presentación del asistente Amy"
    >
      {/* 🎥 Video de fondo */}
      <video
        ref={videoRef}
        src="/video-assistant.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/poster-assistant.jpg"
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      />

      {/* 🌑 Overlay con degradado */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/70 z-0" />

      {/* 🌟 Contenido */}
      <motion.div
        className="z-10 text-center px-6 max-w-4xl"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      >
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight drop-shadow-[0_2px_10px_rgba(138,43,226,0.5)]">
          Conoce a <span className="text-violet-400">Amy</span> — Tu Asistente&nbsp;AI 24/7
        </h1>

        <p className="text-lg md:text-xl text-white/90 mb-6 leading-relaxed drop-shadow">
          Responde, vende y da seguimiento en <span className="font-semibold">WhatsApp, Instagram, Facebook, Llamadas y Campañas</span>.
          <br className="hidden md:block" />
          Todo funcionando hoy mismo, con IA natural y eficiente.
        </p>

        {/* Badges de canales activos */}
        <div className="mx-auto mb-8 flex flex-wrap items-center justify-center gap-3 text-sm">
          <Badge icon={<FaWhatsapp />} label="WhatsApp activo" />
          <Badge icon={<FaFacebookMessenger />} label="Facebook Messenger activo" />
          <Badge icon={<FaInstagram />} label="Instagram DM activo" />
          <Badge icon={<FaMicrophoneAlt />} label="Voz AI activa" />
          <Badge icon={<FaBullhorn />} label="Campañas activas" />
        </div>

        {/* CTA principal */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <a
            href="/login"
            aria-label="Crear cuenta y probar Amy AI gratis sin tarjeta"
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-transform duration-200 hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            Prueba gratis
          </a>

          <a
            href="#benefits"
            className="text-purple-300 hover:text-purple-200 underline-offset-4 hover:underline text-sm md:text-base"
            aria-label="Ver cómo funciona Amy"
          >
            Ver cómo funciona en 60s
          </a>
        </div>

        {/* Micro-prueba social y bilingüe */}
        <p className="mt-6 text-xs md:text-sm text-white/70">
          Ya en uso por negocios locales y e-commerce. <span className="text-white/80">Bilingüe: Español / English.</span>
        </p>
      </motion.div>
    </section>
  );
}

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3 py-1.5 backdrop-blur">
      <i className="text-white/90 text-base">{icon}</i>
      <span className="text-white/80">{label}</span>
    </span>
  );
}
