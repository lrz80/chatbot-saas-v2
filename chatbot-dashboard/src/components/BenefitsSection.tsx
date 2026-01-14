// src/components/BenefitsSection.tsx
'use client';

import { motion } from 'framer-motion';
import { Sparkles, BotMessageSquare, BarChart3, Share2 } from 'lucide-react';

export default function BenefitsSection() {
  const benefits = [
    {
      icon: <Sparkles className="w-8 h-8 text-purple-400" />,
      title: "Responde en segundos, 24/7",
      description:
        "Aamy contesta al instante para que no pierdas ventas cuando estás ocupado o fuera de horario.",
    },
    {
      icon: <BotMessageSquare className="w-8 h-8 text-purple-400" />,
      title: "Todos tus mensajes en un solo lugar",
      description:
        "WhatsApp, Instagram y Facebook centralizados para que no se te escape ningún cliente.",
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-purple-400" />,
      title: "Respuestas con la información real de tu negocio",
      description:
        "Aamy responde solo con la información de tu negocio. No improvisa ni da datos falsos.",
    },
    {
      icon: <Share2 className="w-8 h-8 text-purple-400" />,
      title: "Seguimiento que recupera clientes",
      description:
        "Si el cliente no responde, Aamy hace seguimiento automático para recuperarlo.",
    },
  ];

  return (
    <section id="benefits" className="px-6 py-16 md:py-24 max-w-6xl mx-auto">
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-3xl md:text-5xl font-bold text-center mb-12 text-white"
      >
        ¿Qué gana tu negocio con <span className="text-purple-400">Aamy</span>?
      </motion.h2>

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
      {/* FRASE DE CIERRE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="mt-12 text-center"
      >
        <p className="text-base md:text-lg text-white/80">
          Cada minuto sin responder cuesta dinero.{" "}
          <span className="font-semibold text-white">
            Aamy trabaja por ti 24/7.
          </span>
        </p>
      </motion.div>
    </section>
  );
}
