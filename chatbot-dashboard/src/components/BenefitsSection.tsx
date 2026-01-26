// src/components/BenefitsSection.tsx
'use client';

import { motion } from 'framer-motion';
import { 
  Sparkles, 
  BotMessageSquare, 
  BarChart3, 
  Share2, 
  CalendarCheck, 
  Languages 
} from 'lucide-react';

export default function BenefitsSection() {
  const benefits = [
    {
      icon: <Sparkles className="w-8 h-8 text-purple-400" />,
      title: "IA que entiende contexto e intención",
      description:
        "Aamy no da respuestas genéricas. Interpreta la intención del cliente, mantiene el hilo de la conversación y responde con precisión usando tu información.",
    },
    {
      icon: <BotMessageSquare className="w-8 h-8 text-purple-400" />,
      title: "WhatsApp, Instagram y Facebook en un solo lugar",
      description:
        "Una sola bandeja para todos tus mensajes. Atiende más rápido y evita perder clientes por tener canales dispersos.",
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-purple-400" />,
      title: "Ventas automáticas con seguimiento inteligente",
      description:
        "Si el cliente se enfría, Aamy envía recordatorios estratégicos según la intención detectada. Más cierres sin esfuerzo.",
    },
    {
      icon: <Share2 className="w-8 h-8 text-purple-400" />,
      title: "Optimización de Ads con Pixel + CAPI",
      description:
        "Envía eventos avanzados desde WhatsApp, Instagram y Facebook para mejorar segmentación y bajar tu costo por lead.",
    },
    {
      icon: <CalendarCheck className="w-8 h-8 text-purple-400" />,
      title: "Agendamiento automático con Google Calendar",
      description:
        "Aamy ofrece horarios, valida disponibilidad en tiempo real y confirma citas reales directamente en tu calendario.",
    },
    {
      icon: <Languages className="w-8 h-8 text-purple-400" />,
      title: "Multilenguaje automático",
      description:
        "Tus clientes hablan en su idioma. Aamy también. Detecta español o inglés y responde automáticamente para maximizar conversiones.",
    },
  ];

  return (
    <section id="benefits" className="px-6 py-16 md:py-24 max-w-6xl mx-auto">
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-3xl md:text-5xl font-bold text-center mb-6 text-white"
      >
        ¿Qué gana tu negocio con <span className="text-purple-400">Aamy</span>?
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="text-center text-white/75 max-w-3xl mx-auto mb-12"
      >
        Aamy no solo responde rápido. Usa IA avanzada para entender contexto, detectar intención, agendar citas y optimizar tus campañas de Meta.
      </motion.p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {benefits.map((benefit, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.15 }}
            className="p-6 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
          >
            <div className="mb-4">{benefit.icon}</div>
            <h3 className="text-xl font-semibold mb-2 text-white">{benefit.title}</h3>
            <p className="text-sm text-white/80">{benefit.description}</p>
          </motion.div>
        ))}
      </div>

      {/* FRASE DE CIERRE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="mt-12 text-center"
      >
        <p className="text-base md:text-lg text-white/80">
          No se trata solo de responder.{" "}
          <span className="font-semibold text-white">Se trata de convertir.</span>{" "}
          Aamy te ayuda a cerrar más ventas sin trabajar más.
        </p>
      </motion.div>
    </section>
  );
}
