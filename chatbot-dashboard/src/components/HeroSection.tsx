// src/components/HeroSection.tsx
'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { track } from '@/lib/metaPixel';
import {
  FaWhatsapp,
  FaInstagram,
  FaFacebookF,
  FaCalendarAlt,
  FaPhoneAlt,
  FaClipboardList,
} from 'react-icons/fa';

export default function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.error('Video no se puede reproducir automáticamente:', error);
      });
    }
  }, []);

  return (
    <section className="relative bg-black min-h-[100dvh] md:min-h-screen text-white overflow-hidden flex items-start md:items-center justify-center px-6 font-sans pt-24 md:pt-0 pb-28 md:pb-0">
      {/* Background video */}
      <video
        ref={videoRef}
        src="/video-assistant.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/70 to-[#170f2f]/70 z-0" />

      {/* Content */}
      <motion.div
        className="z-10 text-center max-w-5xl w-full px-1"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        {/* Positioning tag */}
        <div className="mx-auto mb-5 inline-flex items-center gap-2 bg-white/10 border border-white/15 backdrop-blur-md px-4 py-2 rounded-full text-xs text-white/85">
          <FaClipboardList className="text-purple-300" />
          Sistema de atención para negocios por cita
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold mb-5 tracking-tight leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]">
          La atención de tu negocio,
          <br className="hidden md:block" />
          <span className="text-violet-400"> organizada en un solo sistema</span>
        </h1>

        <p className="text-lg md:text-xl text-white/88 mb-7 leading-relaxed drop-shadow max-w-3xl mx-auto">
          Aamy usa tus servicios, horarios, reglas y proceso de reserva para
          atender conversaciones con contexto en mensajes, llamadas y calendario.
        </p>

        {/* Main proof cards */}
        <div className="mx-auto mb-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl">
          <HeroBullet
            icon={<FaWhatsapp className="text-green-300" />}
            title="Mensajes"
            desc="WhatsApp, Instagram y Facebook bajo una misma estructura de atención."
          />

          <HeroBullet
            icon={<FaPhoneAlt className="text-purple-300" />}
            title="Llamadas"
            desc="Conversaciones por voz siguiendo el proceso definido por el negocio."
          />

          <HeroBullet
            icon={<FaCalendarAlt className="text-blue-300" />}
            title="Reservas"
            desc="Flujos guiados para pedir la información correcta antes de confirmar."
          />

          <HeroBullet
            icon={<FaClipboardList className="text-yellow-300" />}
            title="Reglas"
            desc="Servicios, horarios, políticas, zonas y pasos configurados por negocio."
          />
        </div>

        {/* Operational clarity */}
        <div className="mx-auto mb-6 max-w-3xl bg-white/5 border border-white/10 rounded-2xl px-5 py-4 backdrop-blur-md">
          <p className="text-sm md:text-base text-white/80 leading-relaxed">
            No es un bot genérico. Aamy se configura alrededor de cómo trabaja tu
            operación: qué ofreces, qué preguntas deben hacerse, qué datos faltan
            y cuándo una conversación está lista para avanzar.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="/login"
            onClick={() =>
              track('Lead', {
                content_name: 'CTA Solicitar demo Aamy Hero',
              })
            }
            className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-4 rounded-full font-bold text-lg shadow-lg transition-all duration-300 transform hover:scale-[1.03]"
          >
            Solicitar demostración
          </a>

          <a
            href="#how-aamy-works"
            className="bg-white/10 hover:bg-white/15 border border-white/15 text-white px-10 py-4 rounded-full font-bold text-lg shadow-lg transition-all duration-300"
          >
            Ver cómo funciona
          </a>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-white/55 text-xs md:text-sm">
          <span className="inline-flex items-center gap-2">
            <FaWhatsapp className="text-green-300" />
            WhatsApp
          </span>

          <span className="inline-flex items-center gap-2">
            <FaInstagram className="text-pink-300" />
            Instagram
          </span>

          <span className="inline-flex items-center gap-2">
            <FaFacebookF className="text-blue-300" />
            Facebook
          </span>

          <span className="inline-flex items-center gap-2">
            <FaPhoneAlt className="text-purple-300" />
            Voz
          </span>

          <span className="inline-flex items-center gap-2">
            <FaCalendarAlt className="text-blue-300" />
            Calendario
          </span>
        </div>
      </motion.div>
    </section>
  );
}

function HeroBullet({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md text-left">
      <div className="mt-0.5 shrink-0">{icon}</div>

      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-white/70 mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}