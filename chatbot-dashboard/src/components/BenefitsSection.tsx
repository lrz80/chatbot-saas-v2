// src/components/BenefitsSection.tsx
'use client';

import { motion } from 'framer-motion';
import { Sparkles, BotMessageSquare, BarChart3, Share2 } from 'lucide-react';

export default function BenefitsSection() {
  const benefits = [
    {
      icon: <Sparkles className="w-8 h-8 text-purple-400" />,
      title: "Automatización Inteligente",
      description: "Amy responde automáticamente 24/7 en WhatsApp, Instagram, Facebook y llamadas, entendiendo el contexto con IA natural.",
    },
    {
      icon: <BotMessageSquare className="w-8 h-8 text-purple-400" />,
      title: "Entrenamiento Personalizado",
      description: "Entrena a Amy con preguntas frecuentes e intenciones específicas según tu negocio.",
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-purple-400" />,
      title: "Análisis de Conversaciones",
      description: "Identifica oportunidades de venta, detecta emociones, y accede a reportes detallados en tiempo real.",
    },
    {
      icon: <Share2 className="w-8 h-8 text-purple-400" />,
      title: "Campañas Multicanal",
      description: "Lanza promociones por SMS o Email desde el dashboard, todo conectado a tu base de clientes.",
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
        ¿Qué puede hacer <span className="text-purple-400">Amy</span> por ti?
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
