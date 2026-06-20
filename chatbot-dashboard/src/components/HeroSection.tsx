// src/components/HeroSection.tsx
'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
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
import { useI18n } from '../i18n/LanguageProvider';

export default function HeroSection() {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    videoRef.current.play().catch((error) => {
      console.error('Video no se puede reproducir automáticamente:', error);
    });
  }, []);

  return (
    <section className="relative bg-black min-h-[100dvh] md:min-h-screen text-white overflow-hidden flex items-start md:items-center justify-center px-6 font-sans pt-24 md:pt-0 pb-28 md:pb-0">
      <video
        ref={videoRef}
        src="/video-assistant.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      />

      <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/70 to-[#170f2f]/70 z-0" />

      <motion.div
        className="z-10 text-center max-w-5xl w-full px-1"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <div className="mx-auto mb-5 inline-flex items-center gap-2 bg-white/10 border border-white/15 backdrop-blur-md px-4 py-2 rounded-full text-xs text-white/85">
          <FaClipboardList className="text-purple-300" />
          {t('hero.tag')}
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold mb-5 tracking-tight leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]">
          {t('hero.title.line1')}
          <br className="hidden md:block" />
          <span className="text-violet-400">{t('hero.title.line2')}</span>
        </h1>

        <p className="text-lg md:text-xl text-white/88 mb-7 leading-relaxed drop-shadow max-w-3xl mx-auto">
          {t('hero.subtitle')}
        </p>

        <div className="mx-auto mb-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl">
          <HeroBullet
            icon={<FaWhatsapp className="text-green-300" />}
            title={t('hero.bullets.messages.title')}
            desc={t('hero.bullets.messages.desc')}
          />

          <HeroBullet
            icon={<FaPhoneAlt className="text-purple-300" />}
            title={t('hero.bullets.calls.title')}
            desc={t('hero.bullets.calls.desc')}
          />

          <HeroBullet
            icon={<FaCalendarAlt className="text-blue-300" />}
            title={t('hero.bullets.bookings.title')}
            desc={t('hero.bullets.bookings.desc')}
          />

          <HeroBullet
            icon={<FaClipboardList className="text-yellow-300" />}
            title={t('hero.bullets.rules.title')}
            desc={t('hero.bullets.rules.desc')}
          />
        </div>

        <div className="mx-auto mb-6 max-w-3xl bg-white/5 border border-white/10 rounded-2xl px-5 py-4 backdrop-blur-md">
          <p className="text-sm md:text-base text-white/80 leading-relaxed">
            {t('hero.micro')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="/login"
            onClick={() =>
              track('Lead', {
                content_name: 'CTA Request Demo Aamy Hero',
              })
            }
            className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-4 rounded-full font-bold text-lg shadow-lg transition-all duration-300 transform hover:scale-[1.03]"
          >
            {t('hero.cta.primary')}
          </a>

          <a
            href="#how-aamy-works"
            className="bg-white/10 hover:bg-white/15 border border-white/15 text-white px-10 py-4 rounded-full font-bold text-lg shadow-lg transition-all duration-300"
          >
            {t('hero.cta.secondary')}
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
            {t('hero.channels.voice')}
          </span>

          <span className="inline-flex items-center gap-2">
            <FaCalendarAlt className="text-blue-300" />
            {t('hero.channels.calendar')}
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
  icon: ReactNode;
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