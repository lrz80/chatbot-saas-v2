// src/components/DashboardPreviewSection.tsx
'use client';

import { motion } from 'framer-motion';

export default function DashboardPreviewSection() {
  return (
    <section className="px-6 py-20 md:py-32 max-w-6xl mx-auto text-center">
      <motion.h2
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-3xl md:text-5xl font-bold text-white mb-10"
      >
        Tu panel para controlar tu <span className="text-purple-400">Atención 24/7</span>
      </motion.h2>

      <p className="text-white/80 max-w-2xl mx-auto mb-12">
        Ve conversaciones, leads y actividad de tus canales en un solo lugar. Aamy responde con la información de tu
        negocio y tú puedes intervenir cuando quieras. Nosotros lo configuramos y lo dejamos listo para operar.
      </p>

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
          alt="Vista previa del panel de atención 24/7 de Aamy"
          className="relative z-10 rounded-2xl border border-white/10 shadow-2xl"
        />
      </motion.div>
    </section>
  );
}
