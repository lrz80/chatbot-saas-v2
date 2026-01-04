'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function DemoWhatsApp() {
  const mensajes = [
    { de: 'cliente', texto: 'Hola, ¿me puedes dar información?' },
    {
      de: 'amy',
      texto:
        'Hola 👋 Soy Amy, asistente del negocio. Con gusto te ayudo. ¿Qué información te gustaría conocer?',
    },
    { de: 'cliente', texto: 'Quería saber el precio' },
    {
      de: 'amy',
      texto:
        'Claro 😊 El precio depende del servicio que te interese. Puedo explicarte las opciones disponibles.',
    },
    {
      de: 'amy',
      texto:
        'Si quieres, dime qué estás buscando y te doy la información correcta.',
    },
  ];

  return (
    <section className="mt-20 px-6 py-12 max-w-[1000px] mx-auto text-center">
      <h2 className="text-3xl md:text-4xl font-extrabold text-purple-300 mb-6">
        Así responde Aamy cuando un cliente escribe
      </h2>
      <p className="text-gray-300 text-base md:text-lg mb-10">
        Respuestas inmediatas y seguimiento automático sin que tengas que estar pendiente
      </p>

      {/* Contenedor del mockup y mensajes */}
      <div className="relative w-[480px] h-[480px] mx-auto">
        <Image
          src="/mockups/iphone-frame.png"
          alt="iPhone"
          fill
          className="object-contain pointer-events-none select-none z-10"
        />

        {/* Mensajes alineados dentro de la pantalla del iPhone */}
        <div
          className="absolute z-0"
          style={{
            top: 100,     // ajustado proporcionalmente
            left: 195,    // ajustado proporcionalmente
            width: 115,   // proporcional a los 1920 originales
            height: 260,
            overflowY: 'auto',
            padding: '6px',
            backgroundColor: 'rgba(15,15,15,0.9)',
            borderRadius: '12px',
            fontSize: '10px',
          }}
        >
          {mensajes.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: msg.de === 'amy' ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.6 }}
              className={`p-2 rounded-md mb-2 max-w-[90%] ${
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
