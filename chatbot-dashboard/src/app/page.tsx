// src/app/page.tsx
/// <reference types="react" />
'use client';

import Head from 'next/head';
import 'keen-slider/keen-slider.min.css';
import { useKeenSlider } from 'keen-slider/react';
import Footer from '@/components/Footer';
import React, { JSX, useEffect, useState, useRef } from 'react';
import HeroSection from '@/components/HeroSection';
import {
  FaRobot,
  FaChartBar,
  FaWhatsapp,
  FaFacebookMessenger,
  FaInstagram,
  FaMicrophoneAlt,
  FaBullhorn,
  FaUserCheck,
} from 'react-icons/fa';

// 🔥 Features con estilos y descripciones más claras
const features = [
  {
    icon: <FaRobot size={28} className="text-purple-400 drop-shadow" />,
    title: "Automatización 24/7",
    description: "Tu asistente responde a clientes en cualquier momento, sin pausas ni descansos.",
  },
  {
    icon: <FaChartBar size={28} className="text-purple-300 drop-shadow" />,
    title: "Estadísticas en tiempo real",
    description: "Mide interacciones, usuarios únicos y rendimiento con visualizaciones automáticas.",
  },
  {
    icon: <FaWhatsapp size={28} className="text-green-400 drop-shadow" />,
    title: "WhatsApp Automatizado",
    description: "Envía respuestas inteligentes y automatizadas directamente en WhatsApp.",
  },
  {
    icon: <FaFacebookMessenger size={28} className="text-blue-400 drop-shadow" />,
    title: "Facebook (próximamente)",
    description: "La automatización en Messenger estará disponible muy pronto. Estamos en revisión con Meta.",
  },
  {
    icon: <FaInstagram size={28} className="text-pink-400 drop-shadow" />,
    title: "Instagram (próximamente)",
    description: "Automatiza mensajes directos en Instagram. Función habilitada tras revisión de Meta.",
  },
  {
    icon: <FaMicrophoneAlt size={28} className="text-indigo-400 drop-shadow" />,
    title: "Asistente de Voz AI",
    description: "Recibe llamadas con una voz natural que resuelve dudas y agenda citas automáticamente.",
  },
  {
    icon: <FaUserCheck size={28} className="text-yellow-400 drop-shadow" />,
    title: "Seguimiento de Leads",
    description: "Detecta intención de compra y agenda seguimientos automáticos para no perder ventas.",
  },
  {
    icon: <FaBullhorn size={28} className="text-orange-400 drop-shadow" />,
    title: "Campañas de Marketing",
    description: "Crea y programa campañas por WhatsApp, Email o SMS con promociones personalizadas.",
  },
  {
    icon: <FaInstagram size={28} className="text-pink-300 drop-shadow" />,
    title: "Auto-publicaciones (próximamente)",
    description: "Programa publicaciones automáticas en Instagram y Facebook. En desarrollo.",
  },
];

export default function LandingPage() {
  const [sliderRef, slider] = useKeenSlider<HTMLDivElement>({
    loop: true,
    renderMode: "performance",
    slides: {
      perView: 3,
      spacing: 16,
    },
    breakpoints: {
      "(max-width: 768px)": {
        slides: { perView: 1.2, spacing: 12 },
      },
    },
  });

  const [paused, setPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ⏱ Autoplay solo cuando no está pausado
  useEffect(() => {
    if (!slider) return;

    const clearTimer = () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };

    if (!paused) {
      timerRef.current = setInterval(() => {
        slider.current?.next();
      }, 3000);
    }

    return () => clearTimer();
  }, [slider, paused]);

  return (
    <div className="min-h-screen bg-[#0f0a1e] text-white">
      <Head>
        {/* Título y descripción */}
        <title>Automatiza tu negocio con Amy AI | Asistente inteligente 24/7</title>
        <meta
          name="description"
          content="Amy es tu asistente AI para WhatsApp, Instagram y Facebook. Automatiza mensajes, responde clientes y mejora tus ventas."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph para redes sociales */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.aamy.ai/" />
        <meta property="og:title" content="Automatiza tu negocio con Amy AI" />
        <meta
          property="og:description"
          content="Asistente inteligente 24/7 para automatizar WhatsApp, Instagram y Facebook."
        />
        <meta property="og:image" content="https://www.aamy.ai/og-image.png" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://www.aamy.ai/" />
        <meta name="twitter:title" content="Automatiza tu negocio con Amy AI" />
        <meta
          name="twitter:description"
          content="Asistente inteligente 24/7 para automatizar WhatsApp, Instagram y Facebook."
        />
        <meta name="twitter:image" content="https://www.aamy.ai/og-image.png" />
      </Head>

      <HeroSection />

      <section className="py-20 bg-[#0f0a1e] backdrop-blur-sm">
        <h2 className="text-3xl font-bold text-center mb-12 text-white">
          ¿Qué puedes hacer con nuestro Asistente Virtual?
        </h2>
        <div
          ref={sliderRef}
          className="keen-slider px-4"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {features.map((feature, index) => (
            <div key={index} className="keen-slider__slide">
              <FeatureCard {...feature} />
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 bg-[#151032] text-white text-center">
        <h2 className="text-3xl font-bold mb-12 text-purple-300">Lo que dicen nuestros clientes</h2>
        <div className="flex flex-wrap justify-center gap-6">
          <div className="max-w-xs bg-white/10 border border-white/10 p-6 rounded-xl shadow-lg">
            <p className="italic text-sm text-white/80">
              “Desde que usamos Amy, respondemos más rápido y cerramos más ventas por WhatsApp.”
            </p>
            <p className="mt-4 font-bold text-purple-300">— Laura, Tienda Pet</p>
          </div>
          <div className="max-w-xs bg-white/10 border border-white/10 p-6 rounded-xl shadow-lg">
            <p className="italic text-sm text-white/80">
              “Automatizar mis mensajes me ahorra más de 10 horas a la semana.”
            </p>
            <p className="mt-4 font-bold text-purple-300">— Carlos, Clínica Vida</p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 bg-indigo-950/40 text-center backdrop-blur-md">
        <h2 className="text-2xl font-bold mb-4 text-white">¿Listo para comenzar?</h2>
        <p className="mb-6 text-white/80 max-w-xl mx-auto">
          Activa tu membresía y desbloquea el potencial completo de tu Asistente Virtual para optimizar la atención al cliente de tu negocio.
        </p>
        <a href="/login">
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-full text-lg shadow-lg transition">
            Probar Amy AI Gratis
          </button>
        </a>
      </section>
      <Footer />
    </div>
  );
}

// 🧩 Componente de Feature
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: JSX.Element;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-start bg-white/10 border border-white/10 backdrop-blur-md px-6 py-5 rounded-xl shadow-md hover:shadow-lg min-w-[260px] mx-2 hover:scale-105 transition-all duration-300 group cursor-pointer">
      {icon}
      <h3 className="text-base font-semibold mt-2 text-center text-white">{title}</h3>
      <p className="text-sm text-white/70 text-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {description}
      </p>
    </div>
  );
}
