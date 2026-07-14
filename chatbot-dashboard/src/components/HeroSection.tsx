'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { track } from '@/lib/metaPixel';
import {
  FaWhatsapp,
  FaInstagram,
  FaFacebookF,
  FaPhoneAlt,
  FaUserCheck,
  FaCheckCircle,
  FaChartLine,
  FaGoogle,
} from 'react-icons/fa';
import { SiSquare } from 'react-icons/si';
import { useI18n } from '../i18n/LanguageProvider';

export default function HeroSection() {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.play().catch((error: unknown) => {
      console.error(
        'Video no se puede reproducir automáticamente:',
        error
      );
    });
  }, []);

  return (
    <section className="relative min-h-[100dvh] overflow-hidden bg-black px-6 pb-20 pt-24 font-sans text-white md:flex md:min-h-screen md:items-center md:justify-center md:py-20">
      <video
        ref={videoRef}
        src="/video-assistant.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        className="absolute inset-0 z-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 z-0 bg-gradient-to-br from-black/95 via-black/75 to-[#170f2f]/75" />

      <motion.div
        className="relative z-10 mx-auto w-full max-w-7xl text-center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs text-white/85 backdrop-blur-md">
          <FaCheckCircle
            aria-hidden="true"
            className="text-violet-300"
          />

          {t('hero.tag')}
        </div>

        <h1 className="mx-auto mb-5 max-w-5xl text-4xl font-extrabold leading-[1.08] tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)] md:text-6xl lg:text-7xl">
          {t('hero.title.line1')}

          <br className="hidden md:block" />

          <span className="text-violet-400">
            {t('hero.title.line2')}
          </span>
        </h1>

        <p className="mx-auto mb-8 max-w-3xl text-lg leading-relaxed text-white/80 drop-shadow md:text-xl">
          {t('hero.subtitle')}
        </p>

        <div className="mx-auto mb-8 grid max-w-6xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <HeroBullet
            icon={<FaPhoneAlt className="text-violet-300" />}
            title={t('hero.bullets.calls.title')}
            desc={t('hero.bullets.calls.desc')}
          />

          <HeroBullet
            icon={<FaWhatsapp className="text-green-300" />}
            title={t('hero.bullets.messages.title')}
            desc={t('hero.bullets.messages.desc')}
          />

          <HeroBullet
            icon={<FaGoogle className="text-blue-300" />}
            title={t('hero.bullets.bookings.title')}
            desc={t('hero.bullets.bookings.desc')}
          />

          <HeroBullet
            icon={<FaUserCheck className="text-yellow-300" />}
            title={t('hero.bullets.memory.title')}
            desc={t('hero.bullets.memory.desc')}
          />

          <HeroBullet
            icon={<FaChartLine className="text-cyan-300" />}
            title={t('hero.bullets.reports.title')}
            desc={t('hero.bullets.reports.desc')}
          />
        </div>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="/login"
            onClick={() => {
              track('Lead', {
                content_name: 'CTA Request Demo Aamy Hero',
              });
            }}
            className="w-full rounded-full bg-purple-600 px-10 py-4 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:bg-purple-700 sm:w-auto"
          >
            {t('hero.cta.primary')}
          </a>

          <a
            href="#how-aamy-works"
            className="w-full rounded-full border border-white/15 bg-white/10 px-10 py-4 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:bg-white/15 sm:w-auto"
          >
            {t('hero.cta.secondary')}
          </a>
        </div>

        <p className="mt-5 text-sm text-white/60">
          {t('hero.trust')}
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-xs text-white/55 md:text-sm">
          <span className="inline-flex items-center gap-2">
            <FaPhoneAlt
              aria-hidden="true"
              className="text-violet-300"
            />
            {t('hero.channels.voice')}
          </span>

          <span className="inline-flex items-center gap-2">
            <FaWhatsapp
              aria-hidden="true"
              className="text-green-300"
            />
            WhatsApp
          </span>

          <span className="inline-flex items-center gap-2">
            <FaInstagram
              aria-hidden="true"
              className="text-pink-300"
            />
            Instagram
          </span>

          <span className="inline-flex items-center gap-2">
            <FaFacebookF
              aria-hidden="true"
              className="text-blue-300"
            />
            Facebook
          </span>

          <span className="inline-flex items-center gap-2">
            <FaGoogle
              aria-hidden="true"
              className="text-blue-300"
            />
            Google Calendar
          </span>

          <span className="inline-flex items-center gap-2">
            <SiSquare
              aria-hidden="true"
              className="text-white/80"
            />
            Square Appointments
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
    <div className="flex h-full items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur-md transition-colors duration-300 hover:bg-white/10">
      <div
        aria-hidden="true"
        className="mt-0.5 shrink-0 text-lg"
      >
        {icon}
      </div>

      <div>
        <p className="text-sm font-semibold text-white">
          {title}
        </p>

        <p className="mt-1 text-xs leading-relaxed text-white/65">
          {desc}
        </p>
      </div>
    </div>
  );
}