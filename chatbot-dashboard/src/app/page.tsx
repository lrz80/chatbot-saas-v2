/// <reference types="react" />
'use client';

import ParaQuienEsAmy from '@/components/ParaQuienEsAmy';
import Footer from '@/components/Footer';
import React, { useEffect } from 'react';
import HeroSection from '@/components/HeroSection';
import DashboardPreviewSection from '@/components/DashboardPreviewSection';
import WhatsAppDemoButton from '@/components/WhatsAppDemoButton';
import { useI18n } from '../i18n/LanguageProvider';

import { FaWhatsapp } from 'react-icons/fa';

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

      {/* Trust Bar */}
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

            <div className="flex items-center gap-3">
              <ChannelPill label="WhatsApp" variant="wa" />
              <ChannelPill label="Instagram" variant="ig" />
              <ChannelPill label="Facebook" variant="fb" />
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

      <ParaQuienEsAmy />
      <DashboardPreviewSection />

      {/* Final CTA */}
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

/** =========================
 *  New landing sections
 *  ========================= */

function OperatingSystemSection() {
  return (
    <section className="py-20 px-4 sm:px-6 md:px-8 bg-gradient-to-br from-[#0f0a1e] to-[#1c1236]">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl">
          <p className="text-purple-300 text-sm font-semibold mb-3">
            Sistema de atención
          </p>

          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
            La atención de tu negocio, organizada en un solo sistema
          </h2>

          <p className="text-white/70 text-lg leading-relaxed">
            Aamy reúne conversaciones, reglas, reservas, historial e instrucciones
            para que cada cliente sea atendido con contexto y siguiendo la forma
            real en que trabaja tu negocio.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mt-12">
          <SystemCard
            title="Conversaciones con contexto"
            desc="Aamy mantiene el hilo de lo que el cliente ya dijo y continúa sin tratar cada mensaje como una conversación nueva."
          />

          <SystemCard
            title="Reglas del negocio"
            desc="Servicios, horarios, políticas, zonas, pasos requeridos y condiciones se configuran para cada operación."
          />

          <SystemCard
            title="Reservas estructuradas"
            desc="Cuando corresponde, Aamy guía al cliente paso a paso hasta dejar la información lista para confirmar."
          />
        </div>
      </div>
    </section>
  );
}

function HowAamyWorksSection() {
  return (
    <section className="py-20 px-4 sm:px-6 md:px-8 bg-[#0f0a1e]">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <p className="text-purple-300 text-sm font-semibold mb-3">
            Cómo funciona
          </p>

          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-5 leading-tight">
            De información del negocio a atención real
          </h2>

          <p className="text-white/70 leading-relaxed">
            Aamy no se configura con respuestas sueltas. Se configura con la
            operación: qué ofrece el negocio, cómo se reserva, qué datos se
            necesitan y qué reglas deben respetarse antes de responder o confirmar.
          </p>
        </div>

        <div className="grid gap-4">
          <ProcessStep
            n="01"
            title="Se configura la operación"
            desc="Servicios, horarios, preguntas frecuentes, reglas, políticas, zonas de servicio y proceso de reserva."
          />

          <ProcessStep
            n="02"
            title="Se define el flujo correcto"
            desc="Cada negocio puede tener pasos distintos: servicio, empleado, dirección, peso, fecha, nombre, teléfono o confirmación."
          />

          <ProcessStep
            n="03"
            title="El cliente conversa naturalmente"
            desc="El cliente puede escribir o hablar como normalmente lo haría. Aamy interpreta el contexto y sigue el proceso definido."
          />

          <ProcessStep
            n="04"
            title="La información queda organizada"
            desc="El negocio puede ver lo importante: cliente, servicio, fecha, estado, notas y datos pendientes."
          />
        </div>
      </div>
    </section>
  );
}

function BusinessContextSection() {
  return (
    <section className="py-20 px-4 sm:px-6 md:px-8 bg-gradient-to-br from-[#151032] to-[#0f0a1e]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-purple-300 text-sm font-semibold mb-3">
            Contexto operativo
          </p>

          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-5 leading-tight">
            Aamy atiende con la información que define tu negocio
          </h2>

          <p className="text-white/70 leading-relaxed">
            Cada negocio tiene su propia forma de trabajar. Aamy está diseñada
            para respetar esa estructura y evitar respuestas genéricas o procesos
            incompletos.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
          <SystemCard
            title="Servicios"
            desc="Qué ofrece el negocio, cómo se explica y qué información necesita cada servicio."
          />

          <SystemCard
            title="Horarios"
            desc="Disponibilidad, duración de citas, buffers y reglas para ofrecer horarios."
          />

          <SystemCard
            title="Políticas"
            desc="Cancelaciones, depósitos, zonas, condiciones y detalles importantes para el cliente."
          />

          <SystemCard
            title="Tono"
            desc="La forma en que el negocio quiere sonar: profesional, cercana, directa o bilingüe."
          />
        </div>
      </div>
    </section>
  );
}

function ConversationFlowSection() {
  return (
    <section className="py-20 px-4 sm:px-6 md:px-8 bg-[#0f0a1e]">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <p className="text-purple-300 text-sm font-semibold mb-3">
            Ejemplo práctico
          </p>

          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-5 leading-tight">
            Así se ve una atención guiada por proceso
          </h2>

          <p className="text-white/70 leading-relaxed mb-6">
            El cliente no tiene que llenar un formulario frío. Aamy puede
            conversar, pedir la información necesaria y avanzar según las reglas
            configuradas.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-sm text-white/60 mb-4">
              Información estructurada
            </p>

            <div className="grid gap-3 text-sm">
              <InfoRow label="Servicio" value="Full Grooming" />
              <InfoRow label="Mascota" value="20 libras" />
              <InfoRow label="Dirección" value="123 Main Street" />
              <InfoRow label="Horario" value="Mañana, 1:00 p.m." />
              <InfoRow label="Estado" value="Lista para confirmar" />
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <ChatBubble
            who="Cliente"
            text="Hola, necesito una cita para mi perro."
          />

          <ChatBubble
            who="Aamy"
            text="Claro. ¿Qué servicio te gustaría agendar?"
          />

          <ChatBubble who="Cliente" text="Full grooming." />

          <ChatBubble
            who="Aamy"
            text="Perfecto. ¿Cuál es el peso aproximado de tu mascota?"
          />

          <ChatBubble who="Cliente" text="20 libras." />

          <ChatBubble
            who="Aamy"
            text="Gracias. ¿Qué día y hora te gustaría?"
          />

          <ChatBubble who="Cliente" text="Mañana a las 11." />

          <ChatBubble
            who="Aamy"
            text="Ese horario no está disponible. Tengo opciones cercanas a las 9:00 a.m., 11:15 a.m. o 1:00 p.m. ¿Cuál prefieres?"
          />
        </div>
      </div>
    </section>
  );
}

function ControlSection() {
  return (
    <section className="py-20 px-4 sm:px-6 md:px-8 bg-gradient-to-br from-[#0f0a1e] to-[#151032]">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <div className="grid gap-4">
            <ControlRow
              title="Configuración por negocio"
              desc="Cada operación mantiene sus propios servicios, reglas, prompts, horarios e integraciones."
            />

            <ControlRow
              title="Procesos definidos"
              desc="Aamy puede seguir flujos distintos según el servicio, canal, idioma o tipo de solicitud."
            />

            <ControlRow
              title="Información aprobada"
              desc="Las respuestas importantes salen del contexto configurado, no de improvisaciones genéricas."
            />

            <ControlRow
              title="Preparada para crecer"
              desc="La estructura permite manejar múltiples negocios sin mezclar datos, reglas ni comportamientos."
            />
          </div>
        </div>

        <div>
          <p className="text-purple-300 text-sm font-semibold mb-3">
            Control y estructura
          </p>

          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-5 leading-tight">
            Diseñada para operaciones reales, no para respuestas improvisadas
          </h2>

          <p className="text-white/70 leading-relaxed">
            Aamy funciona mejor cuando el negocio necesita consistencia:
            preguntas correctas, información precisa, procesos claros y control
            sobre cómo se atiende cada conversación.
          </p>
        </div>
      </div>
    </section>
  );
}

/** =========================
 *  UI helpers
 *  ========================= */

function ChannelPill({
  label,
  variant,
}: {
  label: string;
  variant: 'wa' | 'ig' | 'fb';
}) {
  const base =
    'flex items-center gap-2 bg-black/20 border border-white/10 rounded-full px-3 py-1';

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