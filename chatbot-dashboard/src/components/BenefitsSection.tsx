// src/components/BenefitsSection.tsx
'use client';

import { motion } from 'framer-motion';
import { Sparkles, BotMessageSquare, BarChart3, Share2 } from 'lucide-react';

export default function BenefitsSection() {
  const benefits = [
    {
      icon: <Sparkles className="w-8 h-8 text-purple-400" />,
      title: "Respuesta inmediata 24/7",
      description:
        "Amy responde al instante a todos los mensajes, a cualquier hora, para que tu negocio nunca deje a un cliente sin respuesta.",
    },
    {
      icon: <BotMessageSquare className="w-8 h-8 text-purple-400" />,
      title: "3 canales en un solo sistema",
      description:
        "Funciona en WhatsApp, Instagram y Facebook con el mismo comportamiento y la misma calidad de respuesta.",
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-purple-400" />,
      title: "Respuestas con la info real de tu negocio",
      description:
        "Responde usando tus servicios, horarios, ubicación y preguntas frecuentes para dar información precisa sin depender de ti.",
    },
    {
      icon: <Share2 className="w-8 h-8 text-purple-400" />,
      title: "Seguimiento automático hasta 23 horas",
      description:
        "Si el cliente no responde, Amy hace seguimiento automático hasta 23h y se detiene en cuanto el cliente contesta.",
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
        ¿Qué hace <span className="text-purple-400">Amy</span> por tu negocio?
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
    </section>
  );
}
