'use client';

import { motion } from 'framer-motion';
import { Store, ShoppingBag, Dumbbell, Brain, CalendarCheck, Languages, Target } from 'lucide-react';

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
      'Tiendas online y negocios que venden por WhatsApp, Instagram y Facebook.',
  },
  {
    icon: <Dumbbell size={36} />,
    title: 'Fitness y educación',
    description:
      'Gimnasios, indoor cycling, yoga, cursos, talleres y escuelas.',
  },
];

const advancedPoints = [
  {
    icon: <Brain className="w-5 h-5 text-purple-300" />,
    title: "Contexto + intención",
    desc: "Aamy interpreta lo que el cliente realmente quiere y responde orientado a conversión.",
  },
  {
    icon: <Languages className="w-5 h-5 text-purple-300" />,
    title: "Bilingue automático",
    desc: "Detecta el idioma del cliente y responde en espanol o ingles, sin configuración extra.",
  },
  {
    icon: <CalendarCheck className="w-5 h-5 text-purple-300" />,
    title: "Agendamiento",
    desc: "Conecta Google Calendar para ofrecer horarios y confirmar citas reales.",
  },
  {
    icon: <Target className="w-5 h-5 text-purple-300" />,
    title: "Ads más rentables",
    desc: "Pixel + CAPI desde conversaciones para optimizar campañas con datos reales.",
  },
];

export default function ParaQuienEsAmy() {
  return (
    <section className="mt-20 px-6 py-12 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10 max-w-6xl mx-auto shadow-xl">
      <h2 className="text-3xl md:text-4xl font-extrabold text-purple-300 text-center mb-6">
        ¿Para quién es <span className="text-purple-300">Aamy</span>?
      </h2>

      <p className="text-center text-gray-300 text-base md:text-lg mb-10 max-w-4xl mx-auto">
        Para negocios que reciben mensajes todos los días y quieren{" "}
        <span className="text-white font-semibold">convertir conversaciones en ventas</span> sin depender de estar pegados al teléfono.
        Aamy responde 24/7 en WhatsApp, Instagram y Facebook, y automatiza seguimiento cuando el cliente se enfría.
      </p>

      {/* Puntos “IA avanzada” (sube percepción de valor antes del filtro) */}
      <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-5xl mx-auto">
        {advancedPoints.map((p, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{p.icon}</div>
              <div>
                <h4 className="text-white font-semibold mb-1">{p.title}</h4>
                <p className="text-sm text-gray-300">{p.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fit / Not fit */}
      <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-4xl mx-auto">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-2">Ideal si…</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Te preguntan precios, horarios, ubicación, disponibilidad y promociones.</li>
            <li>• Pierdes clientes por responder tarde o fuera de horario.</li>
            <li>• Quieres seguimiento automático.</li>
            <li>• Quieres medir intención y resultados (no solo responder).</li>
          </ul>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-2">No es el mejor fit si…</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Tu proceso requiere cotizaciones técnicas extensas y aprobaciones internas en cada caso.</li>
            <li>• No quieres cargar información mínima del negocio (servicios, FAQs, horarios, políticas).</li>
            <li>• Buscas un sistema sin control: Aamy automatiza, pero tú siempre puedes intervenir.</li>
          </ul>
        </div>
      </div>

      {/* Verticales */}
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
