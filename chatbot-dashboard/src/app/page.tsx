/// <reference types="react" />
'use client';

import Footer from '@/components/Footer';
import React, { useEffect } from 'react';
import HeroSection from '@/components/HeroSection';
import DashboardPreviewSection from '@/components/DashboardPreviewSection';
import WhatsAppDemoButton from '@/components/WhatsAppDemoButton';
import { useI18n } from '../i18n/LanguageProvider';
import {
  FaWhatsapp,
  FaInstagram,
  FaFacebookF,
  FaPhoneAlt,
  FaGoogle,
} from 'react-icons/fa';
import { SiSquare } from 'react-icons/si';

export default function LandingPage() {
  const { t } = useI18n();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) =>
          console.log('✅ Service Worker registrado:', registration)
        )
        .catch((error) =>
          console.error('❌ Error al registrar Service Worker:', error)
        );
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0a1e] text-white overflow-x-hidden">
      <HeroSection />

      <section className="px-4 sm:px-6 md:px-8 mt-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-5 bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl px-6 py-5 shadow-sm">
            <div className="text-center lg:text-left">
              <p className="text-sm text-white/90 font-semibold">
                {t('landing.trust.title')}
              </p>
              <p className="text-xs text-white/60 mt-1">
                {t('landing.trust.subtitle')}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-end">
              <ChannelPill
                label={t('hero.channels.voice')}
                variant="voice"
              />

              <ChannelPill label="WhatsApp" variant="wa" />
              <ChannelPill label="Instagram" variant="ig" />
              <ChannelPill label="Facebook" variant="fb" />
              <ChannelPill label="Google Calendar" variant="googleCalendar" />
              <ChannelPill label="Square Appointments" variant="square" />
            </div>
          </div>
        </div>
      </section>

      <OperatingSystemSection />
      <div id="how-aamy-works">
        <HowAamyWorksSection />
      </div>
      <BusinessContextSection />
      <ConversationFlowSection />
      <ControlSection />

      <DashboardPreviewSection />

      <section className="py-16 px-4 sm:px-6 md:px-8 bg-indigo-950/40 text-center backdrop-blur-md">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-extrabold mb-4 text-white">
            {t('landing.final.title')}
          </h2>

          <p className="mb-6 text-white/80 max-w-2xl mx-auto">
            {t('landing.final.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/register">
              <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-full text-lg shadow-lg transition">
                {t('landing.final.cta')}
              </button>
            </a>
          </div>

          <p className="mt-2 text-white/55 text-xs">
            {t('landing.final.tip')}
          </p>
        </div>
      </section>

      <WhatsAppDemoButton />
      <Footer />
    </div>
  );
}

function OperatingSystemSection() {
  const { t } = useI18n();

  return (
    <section className="py-20 px-4 sm:px-6 md:px-8 bg-gradient-to-br from-[#0f0a1e] to-[#1c1236]">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl">
          <p className="text-purple-300 text-sm font-semibold mb-3">
            {t('landing.system.eyebrow')}
          </p>

          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
            {t('landing.system.title')}
          </h2>

          <p className="text-white/70 text-lg leading-relaxed">
            {t('landing.system.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mt-12">
          <SystemCard
            title={t('landing.system.cards.1.title')}
            desc={t('landing.system.cards.1.desc')}
          />

          <SystemCard
            title={t('landing.system.cards.2.title')}
            desc={t('landing.system.cards.2.desc')}
          />

          <SystemCard
            title={t('landing.system.cards.3.title')}
            desc={t('landing.system.cards.3.desc')}
          />
        </div>
      </div>
    </section>
  );
}

function HowAamyWorksSection() {
  const { t } = useI18n();

  return (
    <section className="py-20 px-4 sm:px-6 md:px-8 bg-[#0f0a1e]">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <p className="text-purple-300 text-sm font-semibold mb-3">
            {t('landing.howNew.eyebrow')}
          </p>

          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-5 leading-tight">
            {t('landing.howNew.title')}
          </h2>

          <p className="text-white/70 leading-relaxed">
            {t('landing.howNew.subtitle')}
          </p>
        </div>

        <div className="grid gap-4">
          <ProcessStep
            n="01"
            title={t('landing.howNew.steps.1.title')}
            desc={t('landing.howNew.steps.1.desc')}
          />

          <ProcessStep
            n="02"
            title={t('landing.howNew.steps.2.title')}
            desc={t('landing.howNew.steps.2.desc')}
          />

          <ProcessStep
            n="03"
            title={t('landing.howNew.steps.3.title')}
            desc={t('landing.howNew.steps.3.desc')}
          />

          <ProcessStep
            n="04"
            title={t('landing.howNew.steps.4.title')}
            desc={t('landing.howNew.steps.4.desc')}
          />
        </div>
      </div>
    </section>
  );
}

function BusinessContextSection() {
  const { t } = useI18n();

  return (
    <section className="py-20 px-4 sm:px-6 md:px-8 bg-gradient-to-br from-[#151032] to-[#0f0a1e]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-purple-300 text-sm font-semibold mb-3">
            {t('landing.context.eyebrow')}
          </p>

          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-5 leading-tight">
            {t('landing.context.title')}
          </h2>

          <p className="text-white/70 leading-relaxed">
            {t('landing.context.subtitle')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
          <SystemCard
            title={t('landing.context.cards.1.title')}
            desc={t('landing.context.cards.1.desc')}
          />

          <SystemCard
            title={t('landing.context.cards.2.title')}
            desc={t('landing.context.cards.2.desc')}
          />

          <SystemCard
            title={t('landing.context.cards.3.title')}
            desc={t('landing.context.cards.3.desc')}
          />

          <SystemCard
            title={t('landing.context.cards.4.title')}
            desc={t('landing.context.cards.4.desc')}
          />
        </div>
      </div>
    </section>
  );
}

function ConversationFlowSection() {
  const { t } = useI18n();

  return (
    <section className="py-20 px-4 sm:px-6 md:px-8 bg-[#0f0a1e]">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <p className="text-purple-300 text-sm font-semibold mb-3">
            {t('landing.example.eyebrow')}
          </p>

          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-5 leading-tight">
            {t('landing.example.title')}
          </h2>

          <p className="text-white/70 leading-relaxed mb-6">
            {t('landing.example.subtitle')}
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-sm text-white/60 mb-4">
              {t('landing.example.structured.title')}
            </p>

            <div className="grid gap-3 text-sm">
              <InfoRow
                label={t('landing.example.structured.service')}
                value={t('landing.example.structured.serviceValue')}
              />
              <InfoRow
                label={t('landing.example.structured.pet')}
                value={t('landing.example.structured.petValue')}
              />
              <InfoRow
                label={t('landing.example.structured.address')}
                value={t('landing.example.structured.addressValue')}
              />
              <InfoRow
                label={t('landing.example.structured.time')}
                value={t('landing.example.structured.timeValue')}
              />
              <InfoRow
                label={t('landing.example.structured.status')}
                value={t('landing.example.structured.statusValue')}
              />
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <ChatBubble
            who={t('landing.example.chat.customer')}
            text={t('landing.example.chat.1')}
          />

          <ChatBubble
            who="Aamy"
            text={t('landing.example.chat.2')}
          />

          <ChatBubble
            who={t('landing.example.chat.customer')}
            text={t('landing.example.chat.3')}
          />

          <ChatBubble
            who="Aamy"
            text={t('landing.example.chat.4')}
          />

          <ChatBubble
            who={t('landing.example.chat.customer')}
            text={t('landing.example.chat.5')}
          />

          <ChatBubble
            who="Aamy"
            text={t('landing.example.chat.6')}
          />

          <ChatBubble
            who={t('landing.example.chat.customer')}
            text={t('landing.example.chat.7')}
          />

          <ChatBubble
            who="Aamy"
            text={t('landing.example.chat.8')}
          />
        </div>
      </div>
    </section>
  );
}

function ControlSection() {
  const { t } = useI18n();

  return (
    <section className="py-20 px-4 sm:px-6 md:px-8 bg-gradient-to-br from-[#0f0a1e] to-[#151032]">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <div className="grid gap-4">
            <ControlRow
              title={t('landing.control.rows.1.title')}
              desc={t('landing.control.rows.1.desc')}
            />

            <ControlRow
              title={t('landing.control.rows.2.title')}
              desc={t('landing.control.rows.2.desc')}
            />

            <ControlRow
              title={t('landing.control.rows.3.title')}
              desc={t('landing.control.rows.3.desc')}
            />

            <ControlRow
              title={t('landing.control.rows.4.title')}
              desc={t('landing.control.rows.4.desc')}
            />
          </div>
        </div>

        <div>
          <p className="text-purple-300 text-sm font-semibold mb-3">
            {t('landing.control.eyebrow')}
          </p>

          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-5 leading-tight">
            {t('landing.control.title')}
          </h2>

          <p className="text-white/70 leading-relaxed">
            {t('landing.control.subtitle')}
          </p>
        </div>
      </div>
    </section>
  );
}

type ChannelPillVariant =
  | 'voice'
  | 'wa'
  | 'ig'
  | 'fb'
  | 'googleCalendar'
  | 'square';

function ChannelPill({
  label,
  variant,
}: {
  label: string;
  variant: ChannelPillVariant;
}) {
  const base =
    'inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5';

  const labelClassName = 'text-xs text-white/80';

  switch (variant) {
    case 'voice':
      return (
        <div className={base}>
          <FaPhoneAlt
            aria-hidden="true"
            className="text-violet-300"
          />
          <span className={labelClassName}>{label}</span>
        </div>
      );

    case 'wa':
      return (
        <div className={base}>
          <FaWhatsapp
            aria-hidden="true"
            className="text-green-400"
          />
          <span className={labelClassName}>{label}</span>
        </div>
      );

    case 'ig':
      return (
        <div className={base}>
          <FaInstagram
            aria-hidden="true"
            className="text-pink-300"
          />
          <span className={labelClassName}>{label}</span>
        </div>
      );

    case 'fb':
      return (
        <div className={base}>
          <FaFacebookF
            aria-hidden="true"
            className="text-blue-400"
          />
          <span className={labelClassName}>{label}</span>
        </div>
      );

    case 'googleCalendar':
      return (
        <div className={base}>
          <FaGoogle
            aria-hidden="true"
            className="text-blue-300"
          />
          <span className={labelClassName}>{label}</span>
        </div>
      );

    case 'square':
      return (
        <div className={base}>
          <SiSquare
            aria-hidden="true"
            className="text-white/80"
          />
          <span className={labelClassName}>{label}</span>
        </div>
      );

    default:
      return null;
  }
}

function SystemCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/65 leading-relaxed">{desc}</p>
    </div>
  );
}

function ProcessStep({
  n,
  title,
  desc,
}: {
  n: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-4 items-start bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
      <div className="min-w-12 h-12 rounded-xl bg-purple-600/25 border border-purple-400/20 flex items-center justify-center font-bold text-purple-200">
        {n}
      </div>

      <div>
        <p className="font-semibold text-white">{title}</p>
        <p className="text-sm text-white/65 mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function ChatBubble({ who, text }: { who: string; text: string }) {
  const isAamy = who === 'Aamy';

  return (
    <div className={`mb-4 flex ${isAamy ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 border ${
          isAamy
            ? 'bg-purple-600/20 border-purple-400/20'
            : 'bg-white/10 border-white/10'
        }`}
      >
        <p className="text-xs text-white/45 mb-1">{who}</p>
        <p className="text-sm text-white/85 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-2">
      <span className="text-white/50">{label}</span>
      <span className="text-white/85 text-right">{value}</span>
    </div>
  );
}

function ControlRow({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-black/20 border border-white/10 rounded-xl p-5">
      <p className="font-semibold text-white">{title}</p>
      <p className="text-sm text-white/60 mt-1 leading-relaxed">{desc}</p>
    </div>
  );
}