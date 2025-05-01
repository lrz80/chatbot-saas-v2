'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function DemoWhatsApp() {
  const mensajes = [
    { de: 'cliente', texto: 'Hola, ¿cuánto cuesta el facial?' },
    { de: 'amy', texto: 'Hola 👋 Soy Amy, asistente de Brows & Lashes. El facial cuesta $60 e incluye limpieza profunda y mascarilla.' },
    { de: 'cliente', texto: '¿Tienen citas hoy?' },
    { de: 'amy', texto: 'Sí, tenemos disponibilidad a las 3:00 pm y 5:30 pm. ¿Cuál prefieres?' },
  ];

  return (
    <section className="mt-20 px-6 py-12 max-w-2xl mx-auto text-center">
      <h2 className="text-3xl md:text-4xl font-extrabold text-purple-300 mb-6">
        Conversación simulada con Amy
      </h2>
      <p className="text-gray-300 text-base md:text-lg mb-10">
        Así responde Amy a tus clientes por WhatsApp. Automática, amable y disponible 24/7.
      </p>

      <div className="relative w-[300px] h-[600px] mx-auto">
        <Image
          src="/mockups/iphone-frame.png"
          alt="iPhone frame"
          fill
          className="object-contain pointer-events-none select-none z-10"
        />
        <div className="absolute inset-[40px] rounded-xl z-0 bg-[#0f0f0f]/90 backdrop-blur-md p-3 overflow-y-auto space-y-3 text-white text-sm">
          {mensajes.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: msg.de === 'amy' ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.8, duration: 0.6 }}
              className={`p-3 rounded-xl max-w-[85%] ${
                msg.de === 'amy'
                  ? 'bg-purple-600 ml-auto text-right'
                  : 'bg-white/10 text-left'
              }`}
            >
              {msg.texto}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
