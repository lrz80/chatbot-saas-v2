// src/components/BenefitsSection.tsx
'use client';

import { motion } from 'framer-motion';
import { Sparkles, BotMessageSquare, BarChart3, Share2 } from 'lucide-react';

export default function BenefitsSection() {
  const benefits = [
    {
      icon: <Sparkles className="w-8 h-8 text-purple-400" />,
      title: "IA que entiende contexto (no respuestas genéricas)",
      description:
        "Aamy mantiene el hilo de la conversación, detecta intención de compra y responde con precisión usando el contexto del chat y la información de tu negocio.",
    },
    {
      icon: <BotMessageSquare className="w-8 h-8 text-purple-400" />,
      title: "Omnicanal: WhatsApp, Instagram y Facebook",
      description:
        "Centraliza tus mensajes en un solo sistema. Menos caos, más control y una experiencia consistente para tus clientes.",
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-purple-400" />,
      title: "Más conversiones: seguimiento + datos + métricas",
      description:
        "Si el cliente se enfría, Aamy hace seguimiento automático. Además registra conversaciones e intención para que puedas medir qué está convirtiendo.",
    },
    {
      icon: <Share2 className="w-8 h-8 text-purple-400" />,
      title: "Optimización de Ads con Meta Pixel + CAPI",
      description:
        "Envía eventos desde conversaciones para que Meta aprenda quién realmente convierte. Esto ayuda a mejorar segmentación y bajar el costo por lead.",
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
        Aamy no solo responde rápido: entiende el contexto, detecta intención y automatiza el seguimiento para convertir más conversaciones en ventas.
      </motion.p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {benefits.map((benefit, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
            className="p-6 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
          >
            <div className="mb-4">{benefit.icon}</div>
            <h3 className="text-xl font-semibold mb-2 text-white">{benefit.title}</h3>
            <p className="text-sm text-white/80">{benefit.description}</p>
          </motion.div>
        ))}
      </div>

      {/* FRASE DE CIERRE (más “venta” y menos genérica) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="mt-12 text-center"
      >
        <p className="text-base md:text-lg text-white/80">
          No se trata solo de responder.{" "}
          <span className="font-semibold text-white">
            Se trata de convertir.
          </span>{" "}
          Aamy trabaja 24/7 para que no pierdas oportunidades.
        </p>
      </motion.div>
    </section>
  );
}
