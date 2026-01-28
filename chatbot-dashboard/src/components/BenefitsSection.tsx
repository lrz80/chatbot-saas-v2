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
import { useI18n } from "../i18n/LanguageProvider";

export default function BenefitsSection() {
  const { t } = useI18n();
    const benefits = [
    {
      icon: <Sparkles className="w-8 h-8 text-purple-400" />,
      title: t("benefits.cards.1.title"),
      description: t("benefits.cards.1.desc"),
    },
    {
      icon: <BotMessageSquare className="w-8 h-8 text-purple-400" />,
      title: t("benefits.cards.2.title"),
      description: t("benefits.cards.2.desc"),
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-purple-400" />,
      title: t("benefits.cards.3.title"),
      description: t("benefits.cards.3.desc"),
    },
    {
      icon: <Share2 className="w-8 h-8 text-purple-400" />,
      title: t("benefits.cards.4.title"),
      description: t("benefits.cards.4.desc"),
    },
    {
      icon: <CalendarCheck className="w-8 h-8 text-purple-400" />,
      title: t("benefits.cards.5.title"),
      description: t("benefits.cards.5.desc"),
    },
    {
      icon: <Languages className="w-8 h-8 text-purple-400" />,
      title: t("benefits.cards.6.title"),
      description: t("benefits.cards.6.desc"),
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
        {t("benefits.title")} <span className="text-purple-400">Aamy</span>?
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="text-center text-white/75 max-w-3xl mx-auto mb-12"
      >
        {t("benefits.subtitle")}
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
          {t("benefits.closing.before")}{" "}
          <span className="font-semibold text-white">{t("benefits.closing.highlight")}</span>{" "}
          {t("benefits.closing.after")}
        </p>
      </motion.div>
    </section>
  );
}
