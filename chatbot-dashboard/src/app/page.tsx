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
import WhatsAppDemoButton from '@/components/WhatsAppDemoButton';
import { useI18n } from "../i18n/LanguageProvider";


import {
  FaRobot,
  FaChartBar,
  FaWhatsapp,
  FaBullhorn,
  FaUserCheck,
  FaBullseye,
  FaCalendarAlt,
  FaGlobe,
  FaBrain,
  FaPhoneAlt,
  FaCheckCircle,
} from 'react-icons/fa';

/** =========================
 *  CAPABILITIES (IA avanzada)
 *  ========================= */
const capabilities = [
  { icon: <FaBrain size={26} className="text-purple-300 drop-shadow" />, titleKey: "cap.1.title", descKey: "cap.1.desc" },
  { icon: <FaRobot size={26} className="text-purple-400 drop-shadow" />, titleKey: "cap.2.title", descKey: "cap.2.desc" },
  { icon: <FaGlobe size={26} className="text-blue-300 drop-shadow" />, titleKey: "cap.3.title", descKey: "cap.3.desc" },
  { icon: <FaUserCheck size={26} className="text-yellow-300 drop-shadow" />, titleKey: "cap.4.title", descKey: "cap.4.desc" },
  { icon: <FaBullhorn size={26} className="text-orange-300 drop-shadow" />, titleKey: "cap.5.title", descKey: "cap.5.desc" },
  { icon: <FaCalendarAlt size={26} className="text-green-300 drop-shadow" />, titleKey: "cap.6.title", descKey: "cap.6.desc" },
  { icon: <FaBullseye size={26} className="text-pink-300 drop-shadow" />, titleKey: "cap.7.title", descKey: "cap.7.desc" },
];

/** =========================
 *  Comparison table
 *  ========================= */
const comparisonRows = [
  { feature: "IA contextual (no solo flujos)", aamy: true, manychat: "Parcial", respond: "Parcial", tidio: false },
  { feature: "Detección de intención de compra", aamy: true, manychat: false, respond: false, tidio: false },
  { feature: "Multilenguaje automático", aamy: true, manychat: "Parcial", respond: "Parcial", tidio: false },
  { feature: "Follow-up automático", aamy: true, manychat: true, respond: "Depende", tidio: false },
  { feature: "Agendamiento con Google Calendar", aamy: true, manychat: false, respond: false, tidio: false },
  { feature: "Meta Pixel + CAPI desde chat", aamy: true, manychat: "Depende", respond: "Depende", tidio: false },
];

export default function LandingPage() {
  const { t } = useI18n();
  const [sliderRef, slider] = useKeenSlider<HTMLDivElement>({
    loop: true,
    renderMode: 'performance',
    slides: { perView: 3, spacing: 16 },
    breakpoints: {
      '(max-width: 1024px)': { slides: { perView: 2, spacing: 12 } },
      '(max-width: 768px)': { slides: { perView: 1.15, spacing: 12 } },
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
      }, 3200);
    }

    return () => clearTimer();
  }, [slider, paused]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => console.log('✅ Service Worker registrado:', registration))
        .catch((error) => console.error('❌ Error al registrar Service Worker:', error));
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0a1e] text-white overflow-x-hidden">
      <HeroSection />

      {/* Trust Bar: Meta Tech Provider */}
      <section className="px-4 sm:px-6 md:px-8 mt-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-5 bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl px-6 py-5 shadow-sm">

            {/* Texto principal */}
            <div className="text-center lg:text-left">
              <p className="text-sm text-white/90 font-semibold">
                {t("landing.trust.title")}
              </p>
              <p className="text-xs text-white/60 mt-1">
                {t("landing.trust.subtitle")}
              </p>
            </div>

            {/* Pills de canales */}
            <div className="flex items-center gap-3">
              <ChannelPill label="WhatsApp" variant="wa" />
              <ChannelPill label="Instagram" variant="ig" />
              <ChannelPill label="Facebook" variant="fb" />
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities slider */}
      <section className="py-20 px-4 sm:px-6 md:px-8 bg-gradient-to-br from-[#0f0a1e] to-[#1c1236]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4 text-white">
            {t("landing.capabilities.title")}
          </h2>
          <p className="text-center text-white/70 max-w-3xl mx-auto mb-12">
            {t("landing.capabilities.subtitle")}
          </p>

          <div
            ref={sliderRef}
            className="keen-slider"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {capabilities.map((cap, index) => (
              <div key={index} className="keen-slider__slide w-full flex justify-center">
                <FeatureCard
                  icon={cap.icon}
                  title={t(cap.titleKey)}
                  description={t(cap.descKey)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6 md:px-8 bg-[#0f0a1e]">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <h3 className="text-3xl font-extrabold text-white mb-4">
              {t("landing.how.title")}
            </h3>
            <p className="text-white/70 mb-8">
              {t("landing.how.subtitle")}
            </p>

            <div className="grid gap-4">
              <StepItem
                n="1"
                title="Configuración del negocio"
                desc="Servicios, horarios, ubicación, FAQs y estilo de respuesta por canal."
              />
              <StepItem
                n="2"
                title="Activación omnicanal"
                desc="WhatsApp, Instagram y Facebook conectados para responder desde un mismo sistema."
              />
              <StepItem
                n="3"
                title="Optimización y conversión"
                desc="Intención de compra, seguimiento automático y eventos Pixel/CAPI para mejorar ads."
              />
            </div>
          </div>

          <div className="lg:sticky lg:top-24 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h4 className="text-xl font-bold text-white mb-2">{t("landing.results.title")}</h4>
            <p className="text-white/70 text-sm mb-6">
              {t("landing.results.subtitle")}
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <MiniStat title="Respuesta 24/7" desc="Sin perder leads fuera de horario" />
              <MiniStat title="Más cierres" desc="Seguimiento automático con intención" />
              <MiniStat title="Menos costo por lead" desc="Pixel/CAPI aprende quién convierte" />
              <MiniStat title="Más control" desc="Dashboard con historial y KPIs" />
            </div>

            <div className="mt-6 flex gap-3 flex-col sm:flex-row">
              <a href="/register" className="w-full">
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition">
                  {t("landing.results.cta")}
                </button>
              </a>
              
            </div>
            <p className="mt-3 text-white/60 text-xs">
              {t("landing.pricing.line")}
            </p>
          </div>
        </div>
      </section>

      {/* Keep your existing sections */}
      <ParaQuienEsAmy />
      <BenefitsSection />
      <DashboardPreviewSection />

      {/* Comparison */}
      <section className="py-20 px-4 sm:px-6 md:px-8 bg-gradient-to-br from-[#0f0a1e] to-[#151032]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-4 text-white">
            {t("landing.compare.title")}
          </h2>
          <p className="text-center text-white/70 max-w-3xl mx-auto mb-10">
            {t("landing.compare.subtitle")}
          </p>

          <div className="overflow-x-auto bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="text-white/80">
                <tr className="border-b border-white/10">
                  <th className="text-left p-4">Función</th>
                  <th className="text-left p-4">Aamy</th>
                  <th className="text-left p-4">ManyChat</th>
                  <th className="text-left p-4">Respond.io</th>
                  <th className="text-left p-4">Tidio</th>
                </tr>
              </thead>
              <tbody className="text-white/75">
                {comparisonRows.map((r, idx) => (
                  <tr key={idx} className="border-b border-white/10">
                    <td className="p-4 text-white/80">{r.feature}</td>
                    <td className="p-4">{renderCell(r.aamy)}</td>
                    <td className="p-4">{renderCell(r.manychat)}</td>
                    <td className="p-4">{renderCell(r.respond)}</td>
                    <td className="p-4">{renderCell(r.tidio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-center text-white/55 text-xs mt-3">
            {t("landing.compare.note")}
          </p>
        </div>
      </section>

      {/* Testimonials (upgrade copy) */}
      <section className="py-20 px-4 sm:px-6 md:px-8 bg-[#151032] text-white text-center">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-extrabold mb-10 text-purple-200">{t("landing.testimonials.title")}</h2>

          <div className="flex flex-wrap justify-center gap-6">
            <TestimonialCard
              quote="Desde que usamos Aamy, respondemos más rápido y recuperamos leads que antes se perdían fuera de horario."
              name="Laura"
              biz="Pet Grooming"
            />
            <TestimonialCard
              quote="La IA entiende mejor las preguntas y el seguimiento automático nos está ayudando a cerrar más citas."
              name="Luis"
              biz="Indoor Cycling Studio"
            />
            <TestimonialCard
              quote="Ahora los mensajes se atienden solos y el equipo se enfoca en vender y entregar el servicio."
              name="Andrea"
              biz="Beauty Studio"
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 sm:px-6 md:px-8 bg-indigo-950/40 text-center backdrop-blur-md">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-extrabold mb-4 text-white">
            {t("landing.final.title")}
          </h2>
          <p className="mb-6 text-white/80 max-w-2xl mx-auto">
            {t("landing.final.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/register">
              <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-full text-lg shadow-lg transition">
                {t("landing.final.cta")}
              </button>
            </a>
          </div>

          <p className="mt-3 text-white/70 text-sm">
            {t("landing.pricing.line")}
          </p>
          <p className="mt-2 text-white/55 text-xs">
            {t("landing.final.tip")}
          </p>
        </div>
      </section>

      <WhatsAppDemoButton />
      <Footer />
    </div>
  );
}

/** =========================
 *  UI helpers
 *  ========================= */

function ChannelPill({ label, variant }: { label: string; variant: 'wa' | 'ig' | 'fb' }) {
  const base = "flex items-center gap-2 bg-black/20 border border-white/10 rounded-full px-3 py-1";
  if (variant === 'wa') {
    return (
      <div className={base}>
        <FaWhatsapp className="text-green-400" />
        <span className="text-xs text-white/80">{label}</span>
      </div>
    );
  }
  if (variant === 'ig') {
    return (
      <div className={base}>
        <span className="text-xs font-semibold text-white/80">IG</span>
        <span className="text-xs text-white/80">{label}</span>
      </div>
    );
  }
  return (
    <div className={base}>
      <span className="text-xs font-semibold text-white/80">FB</span>
      <span className="text-xs text-white/80">{label}</span>
    </div>
  );
}

function StepItem({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4 items-start bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
      <div className="w-9 h-9 rounded-full bg-purple-600/30 border border-purple-400/20 flex items-center justify-center font-bold text-purple-200">
        {n}
      </div>
      <div>
        <p className="font-semibold text-white">{title}</p>
        <p className="text-sm text-white/70 mt-1">{desc}</p>
      </div>
    </div>
  );
}

function MiniStat({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-black/20 border border-white/10 rounded-xl p-4">
      <p className="font-semibold text-white">{title}</p>
      <p className="text-xs text-white/65 mt-1">{desc}</p>
    </div>
  );
}

function TestimonialCard({ quote, name, biz }: { quote: string; name: string; biz: string }) {
  return (
    <div className="w-full max-w-sm bg-white/10 border border-white/10 p-6 rounded-2xl shadow-lg text-left">
      <p className="italic text-sm text-white/80">“{quote}”</p>
      <p className="mt-4 font-bold text-purple-200">— {name}</p>
      <p className="text-xs text-white/60">{biz}</p>
    </div>
  );
}

function renderCell(value: boolean | string) {
  if (typeof value === 'boolean') {
    return value ? (
      <span className="inline-flex items-center gap-2 text-green-200">
        <FaCheckCircle className="text-green-300" /> Sí
      </span>
    ) : (
      <span className="text-white/50">No</span>
    );
  }
  return <span className="text-white/70">{value}</span>;
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
    <div className="w-full max-w-sm flex flex-col items-center justify-start bg-white/10 border border-white/10 backdrop-blur-md px-6 py-6 rounded-2xl shadow-md hover:shadow-lg mx-2 hover:scale-[1.02] transition-all duration-300 group cursor-pointer">
      {icon}
      <h3 className="text-base font-semibold mt-3 text-center text-white">{title}</h3>
      <p className="text-sm text-white/70 text-center mt-2">
        {description}
      </p>
    </div>
  );
}
