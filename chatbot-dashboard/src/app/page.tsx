/// <reference types="react" />
'use client';

import DemoWhatsApp from '@/components/DemoWhatsApp';
import ParaQuienEsAmy from '@/components/ParaQuienEsAmy';
import 'keen-slider/keen-slider.min.css';
import { useKeenSlider } from 'keen-slider/react';
import Footer from '@/components/Footer';
import React, { JSX, useEffect, useState, useRef } from 'react';
import HeroSection from '@/components/HeroSection';
import BenefitsSection from "@/components/BenefitsSection";
import DashboardPreviewSection from "@/components/DashboardPreviewSection";
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
    title: "Respuesta inmediata 24/7",
    description: "Todos los mensajes reciben respuesta al instante, a cualquier hora, sin que tú estés pendiente.",
  },
  {
    icon: <FaWhatsapp size={28} className="text-green-400 drop-shadow" />,
    title: "WhatsApp, Instagram y Facebook",
    description: "Atiende tus DMs y mensajes desde los 3 canales en un solo sistema.",
  },
  {
    icon: <FaUserCheck size={28} className="text-yellow-400 drop-shadow" />,
    title: "Captura de leads automática",
    description: "Obtiene nombre y motivo del cliente para que no se pierda ninguna oportunidad.",
  },
  {
    icon: <FaChartBar size={28} className="text-purple-300 drop-shadow" />,
    title: "Respuestas con info real",
    description: "Responde con servicios, horarios, ubicación y preguntas frecuentes del negocio.",
  },
  {
    icon: <FaBullhorn size={28} className="text-orange-400 drop-shadow" />,
    title: "Seguimiento hasta 23 horas",
    description: "Si el cliente no responde, el sistema hace seguimiento automático hasta 23h y se detiene si responde.",
  },
];

export default function LandingPage() {
  const [sliderRef, slider] = useKeenSlider<HTMLDivElement>({
    loop: true,
    renderMode: 'performance',
    slides: {
      perView: 3,
      spacing: 16,
    },
    breakpoints: {
      '(max-width: 768px)': {
        slides: { perView: 1.2, spacing: 12 },
      },
    },
  });

  const [paused, setPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('✅ Service Worker registrado:', registration);
        })
        .catch((error) => {
          console.error('❌ Error al registrar Service Worker:', error);
        });
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0a1e] text-white overflow-x-hidden">
      <HeroSection />

      <section className="py-20 px-4 sm:px-6 md:px-8 bg-gradient-to-br from-[#0f0a1e] to-[#1c1236]">
        <h2 className="text-3xl font-bold text-center mb-12 text-white">
          ¿Qué puedes hacer con nuestro Asistente Virtual?
        </h2>
        <div
          ref={sliderRef}
          className="keen-slider"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {features.map((feature, index) => (
            <div key={index} className="keen-slider__slide w-full flex justify-center">
              <FeatureCard {...feature} />
            </div>
          ))}
        </div>
      </section>

      <ParaQuienEsAmy />

      <BenefitsSection />

      <DashboardPreviewSection />

      <DemoWhatsApp />

      <section className="py-20 px-4 sm:px-6 md:px-8 bg-[#151032] text-white text-center">
        <h2 className="text-3xl font-bold mb-12 text-purple-300">Lo que dicen nuestros clientes</h2>
        <div className="flex flex-wrap justify-center gap-6">
          <div className="w-full max-w-xs bg-white/10 border border-white/10 p-6 rounded-xl shadow-lg">
            <p className="italic text-sm text-white/80">
              “Desde que usamos Amy, respondemos más rápido y agendamos más citas por WhatsApp.”
            </p>
            <p className="mt-4 font-bold text-purple-300">— Laura, Pet Grooming</p>
          </div>
          <div className="w-full max-w-xs bg-white/10 border border-white/10 p-6 rounded-xl shadow-lg">
            <p className="italic text-sm text-white/80">
              “Automatizar mis mensajes me ahorra más de 10 horas a la semana.”
            </p>
            <p className="mt-4 font-bold text-purple-300">— Luis, Indoor Cycling Studio</p>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 md:px-8 bg-indigo-950/40 text-center backdrop-blur-md">
        <h2 className="text-2xl font-bold mb-4 text-white">¿Listo para comenzar?</h2>
        <p className="mb-6 text-white/80 max-w-xl mx-auto">
          Activa tu membresía y desbloquea el potencial completo de tu Asistente Virtual para optimizar la atención al cliente de tu negocio.
        </p>
        <a href="/login">
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-full text-lg shadow-lg transition">
            Activar Atención Automática 24/7
          </button>
        </a>
        <p className="mt-3 text-white/70 text-sm">
          $399 instalación + primer mes • $199/mes desde el mes 2
        </p>

      </section>

      <Footer />
    </div>
  );
}

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
    <div className="w-full max-w-xs flex flex-col items-center justify-start bg-white/10 border border-white/10 backdrop-blur-md px-6 py-5 rounded-xl shadow-md hover:shadow-lg mx-2 hover:scale-105 transition-all duration-300 group cursor-pointer">
      {icon}
      <h3 className="text-base font-semibold mt-2 text-center text-white">{title}</h3>
      <p className="text-sm text-white/70 text-center mt-2 transition-opacity duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100">
        {description}
      </p>
    </div>
  );
}
