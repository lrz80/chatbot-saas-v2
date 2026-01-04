'use client';

import { FaWhatsapp } from 'react-icons/fa';

export default function WhatsAppDemoButton() {
  const phone = '17752786976';
  const text = 'Hola, quiero probar el demo de Aamy';

  return (
    <a
      href={`https://wa.me/${phone}?text=${encodeURIComponent(text)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Probar demo por WhatsApp"
      className="
        fixed bottom-6 right-6 z-[9999]
        w-14 h-14 md:w-16 md:h-16
        rounded-full
        bg-[#25D366]
        hover:bg-[#1ebe5d]
        shadow-2xl
        flex items-center justify-center
        transition-all duration-300
        hover:scale-110
      "
    >
      <FaWhatsapp className="text-white w-7 h-7 md:w-8 md:h-8" />

      {/* Tooltip tipo WhatsApp */}
      <span
        className="
          absolute right-20
          bg-white text-black text-xs
          px-3 py-2 rounded-lg
          shadow-md
          whitespace-nowrap
          hidden md:block
        "
      >
        Probar demo
      </span>
    </a>
  );
}
