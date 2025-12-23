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
    title: 'E-commerce y ventas por catálogo',
    description:
      'Tiendas online y negocios que reciben pedidos por WhatsApp, Instagram y Facebook.',
  },
  {
    icon: <Dumbbell size={36} />,
    title: 'Academias y estudios',
    description:
      'Gimnasios, indoor cycling, yoga, cursos, talleres y escuelas.',
  },
];

export default function ParaQuienEsAmy() {
  return (
    <section className="mt-20 px-6 py-12 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10 max-w-6xl mx-auto shadow-xl">
      <h2 className="text-3xl md:text-4xl font-extrabold text-purple-300 text-center mb-6">
        ¿Para quién es Amy?
      </h2>

      <p className="text-center text-gray-300 text-base md:text-lg mb-10">
        Para cualquier negocio que reciba mensajes y no quiera perder clientes por no responder a tiempo.
        Amy responde 24/7 por WhatsApp, Instagram y Facebook, y hace seguimiento automático hasta 23 horas.
      </p>

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
