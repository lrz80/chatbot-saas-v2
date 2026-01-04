'use client';

import { motion } from 'framer-motion';
import { Store, ShoppingBag, Dumbbell } from 'lucide-react';

const targetList = [
  {
    icon: <Store size={36} />,
    title: 'Negocios locales',
    description:
      'Salones de belleza, clínicas, barberías, estudios de tatuajes, consultorios y más.',
  },
  {
    icon: <ShoppingBag size={36} />,
    title: 'E-commerce y ventas por DM',
    description:
      'Tiendas online y negocios que reciben pedidos por WhatsApp, Instagram y Facebook.',
  },
  {
    icon: <Dumbbell size={36} />,
    title: 'Fitness y educación',
    description:
      'Gimnasios, indoor cycling, yoga, cursos, talleres y escuelas.',
  },
];

export default function ParaQuienEsAmy() {
  return (
    <section className="mt-20 px-6 py-12 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10 max-w-6xl mx-auto shadow-xl">
      <h2 className="text-3xl md:text-4xl font-extrabold text-purple-300 text-center mb-6">
        ¿Para quién es <span className="text-purple-300">Aamy</span>?
      </h2>

      <p className="text-center text-gray-300 text-base md:text-lg mb-10">
        Para negocios que reciben mensajes todos los días y quieren convertirlos en ventas sin depender de estar pegados al
        teléfono. Aamy responde en segundos por WhatsApp, Instagram y Facebook, y hace seguimiento automático si el cliente
        se enfría.
      </p>

      <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-4xl mx-auto">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-2">Ideal si…</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Te escriben preguntando precios, horarios, ubicación o disponibilidad.</li>
            <li>• Pierdes clientes por responder tarde.</li>
            <li>• Quieres seguimiento automático sin verte “intenso”.</li>
          </ul>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-2">No es para ti si…</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Necesitas cotizaciones complejas o respuestas 100% manuales en cada caso.</li>
            <li>• No quieres configurar tu información (servicios, FAQs, horarios).</li>
            <li>• Buscas “magia” sin supervisión: tú siempre puedes intervenir.</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {targetList.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.2 }}
            viewport={{ once: true }}
            className="bg-white/10 p-6 rounded-xl border border-white/20 text-center hover:bg-white/20 transition"
          >
            <div className="flex justify-center mb-4 text-purple-300">{item.icon}</div>
            <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
            <p className="text-sm text-gray-300">{item.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
