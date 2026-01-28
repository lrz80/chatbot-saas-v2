// src/components/HeroSection.tsx
'use client';

import { useEffect, useRef, JSX } from 'react';
import { motion } from 'framer-motion';
import { track } from "@/lib/metaPixel";
import { FaWhatsapp, FaCalendarAlt, FaBullseye, FaBrain } from "react-icons/fa";
import { useI18n } from "../i18n/LanguageProvider";


export default function HeroSection() {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((e) => {
        console.error('Video no se puede reproducir automáticamente:', e);
      });
    }
  }, []);

  return (
    <section className="relative bg-black min-h-[100dvh] md:min-h-screen text-white overflow-hidden flex items-start md:items-center justify-center px-6 font-sans pt-24 md:pt-0 pb-28 md:pb-0">
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
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/50 to-transparent z-0" />

      {/* 🌟 Hero Content */}
      <motion.div
        className="z-10 text-center max-w-3xl w-full px-1"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        {/* Tag superior (posicionamiento) */}
        <div className="mx-auto mb-5 inline-flex items-center gap-2 bg-white/10 border border-white/15 backdrop-blur-md px-4 py-2 rounded-full text-xs text-white/85">
          <FaBrain className="text-purple-300" />
          {t("hero.tag")}
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold mb-5 tracking-tight leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]">
          {t("hero.h1.before")}{" "}
          <span className="text-violet-400">{t("hero.h1.highlight1")}</span>
          <br className="hidden md:block" />
          {t("hero.h1.after")} <span className="text-violet-400">{t("hero.h1.highlight2")}</span>
        </h1>

        <p className="text-lg md:text-xl text-white/90 mb-7 leading-relaxed drop-shadow">
          {t("hero.subtitle")}
        </p>

        {/* Bullet grid (4 puntos premium, compactos) */}
        <div className="mx-auto mb-7 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl">
          <HeroBullet
            icon={<FaWhatsapp className="text-green-300" />}
            title={t("hero.bullets.omni.title")}
            desc={t("hero.bullets.omni.desc")}
          />
          <HeroBullet
            icon={<FaBullseye className="text-pink-300" />}
            title={t("hero.bullets.pixel.title")}
            desc={t("hero.bullets.pixel.desc")}
          />
          <HeroBullet
            icon={<FaCalendarAlt className="text-blue-300" />}
            title={t("hero.bullets.booking.title")}
            desc={t("hero.bullets.booking.desc")}
          />
          <HeroBullet
            icon={<FaBrain className="text-purple-300" />}
            title={t("hero.bullets.intent.title")}
            desc={t("hero.bullets.intent.desc")}
          />
        </div>

        {/* Micro-clarificación (evitar objeción sin sonar limitado) */}
        <div className="mx-auto mb-4 max-w-3xl text-sm text-white/80">
          {t("hero.micro")}
        </div>

        {/* Precio visible */}
        <div className="mb-2 text-white/85 text-sm">
          <span className="font-semibold text-white">$399 USD</span> {t("hero.pricing.setup")} ·{" "}
          <span className="font-semibold text-white">$199 USD</span>{t("hero.pricing.monthly")}
        </div>

        <div className="mb-6 text-white/70 text-xs">
          {t("hero.tip.before")}{" "}
          <span className="font-semibold text-white">{t("hero.tip.highlight1")}</span>, {t("hero.tip.middle")}{" "}
          <span className="font-semibold text-white">{t("hero.tip.highlight2")}</span>.
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="/login"
            onClick={() => track("Lead", { content_name: "CTA Activar Aamy (Hero)" })}
            className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-4 rounded-full font-bold text-lg shadow-lg transition-all duration-300 transform hover:scale-[1.03]"
          >
            {t("hero.cta")}
          </a>

        </div>

        <p className="mt-4 text-white/60 text-xs md:text-sm">
          {t("hero.note")}
        </p>
      </motion.div>
    </section>
  );
}

function HeroBullet({
  icon,
  title,
  desc,
}: {
  icon: JSX.Element;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md text-left">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-white/70 mt-1">{desc}</p>
      </div>
    </div>
  );
}
