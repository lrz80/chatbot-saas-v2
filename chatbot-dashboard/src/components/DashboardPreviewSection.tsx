// src/components/DashboardPreviewSection.tsx
'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles, BarChart3, MessageSquare, Target } from 'lucide-react';

export default function DashboardPreviewSection() {
  const bullets = [
    {
      icon: <MessageSquare className="w-5 h-5 text-purple-300" />,
      title: "Historial omnicanal",
      desc: "WhatsApp, Instagram y Facebook en una sola vista, con conversaciones organizadas por cliente.",
    },
    {
      icon: <Target className="w-5 h-5 text-purple-300" />,
      title: "Intención de compra detectada",
      desc: "Identifica leads fríos, tibios y calientes para priorizar el cierre (sin adivinar).",
    },
    {
      icon: <Sparkles className="w-5 h-5 text-purple-300" />,
      title: "Follow-up automático",
      desc: "Seguimientos programados según el contexto e intención: recupera ventas que se iban a perder.",
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-purple-300" />,
      title: "KPIs y rendimiento",
      desc: "Mide conversaciones, intención, horarios pico y resultados. Optimiza con datos, no con suposiciones.",
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-purple-300" />,
      title: "Eventos Meta Pixel + CAPI",
      desc: "Registra eventos desde el chat para mejorar segmentación y bajar tu costo por lead en campañas.",
    },
  ];

  return (
    <section className="px-6 py-20 md:py-32 max-w-6xl mx-auto text-center">
      <motion.h2
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-3xl md:text-5xl font-bold text-white mb-6"
      >
        Un dashboard para controlar{" "}
        <span className="text-purple-400">conversaciones, ventas y seguimiento</span>
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="text-white/80 max-w-3xl mx-auto mb-10"
      >
        Aamy no es solo “atención 24/7”. Es un sistema de IA que centraliza canales, detecta intención de compra,
        automatiza seguimientos, envia eventos a META PIXEL/CAPI para mejorar tus ads y te muestra métricas para mejorar conversiones y campañas.
      </motion.p>

      {/* Bullets (valor real del dashboard) */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12 text-left">
        {bullets.map((b, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 * idx }}
            className="p-5 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{b.icon}</div>
              <div>
                <p className="font-semibold text-white">{b.title}</p>
                <p className="text-sm text-white/75 mt-1">{b.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative max-w-5xl mx-auto"
      >
        {/* 🔮 Glow de fondo */}
        <div className="absolute inset-0 blur-3xl bg-purple-500/20 rounded-3xl z-0" />

        {/* 🖼 Imagen del dashboard */}
        <img
          src="/mockup-dashboard.png"
          alt="Vista previa del dashboard de Aamy: conversaciones, intención, seguimiento y KPIs"
          className="relative z-10 rounded-2xl border border-white/10 shadow-2xl"
        />
      </motion.div>

      {/* cierre corto */}
      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="text-white/60 text-sm mt-8"
      >
        Configuración guiada con tu información. Tú controlas todo; Aamy ejecuta.
      </motion.p>
    </section>
  );
}
