'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function DemoWhatsApp() {
  const mensajes = [
    { de: 'cliente', texto: 'Hola, ¿cuánto cuesta el facial?' },
    { de: 'amy', texto: 'Hola 👋 Soy Amy, asistente de AC Studio. El facial cuesta $60 e incluye limpieza facial profunda.'},
    { de: 'cliente', texto: '¿Tienen citas hoy?' },
    { de: 'amy', texto: 'Sí, tenemos disponibilidad a las 3:00 pm y 5:30 pm. ¿Cuál prefieres?' },
  ];

  return (
    <section className="mt-20 px-6 py-12 max-w-xl mx-auto text-center">
      <h2 className="text-3xl md:text-4xl font-extrabold text-purple-300 mb-6">
        Interacción automatizada con Amy
      </h2>
      <p className="text-gray-300 text-base md:text-lg mb-10">
        Atiende a tus clientes 24/7 con respuestas inteligentes
      </p>

      <div className="relative w-[300px] h-[600px] mx-auto">
        {/* iPhone Frame */}
        <Image
          src="/mockups/iphone-frame.png"
          alt="iPhone"
          fill
          className="object-contain pointer-events-none select-none z-10"
        />

        {/* Mensajes dentro de la pantalla */}
        <div
          className="absolute z-0"
          style={{
            top: 395,
            left: 805,
            width: 310,
            height: 690,
            overflowY: 'auto',
            padding: '12px',
            backgroundColor: 'rgba(15,15,15,0.9)',
            borderRadius: '1rem',
          }}
        >

          {mensajes.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: msg.de === 'amy' ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.6 }}
              className={`p-2 rounded-lg text-sm max-w-[85%] ${
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
