'use client';

import { FaWhatsapp } from 'react-icons/fa';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/metaPixel';
import { useI18n } from "../i18n/LanguageProvider";


export default function WhatsAppDemoButton() {
  const { t } = useI18n();
  const pathname = usePathname();

  // 🔒 Solo mostrar en la home
  if (pathname !== '/') return null;

  const phone = '17752786976';
  const text = t("waDemo.initialText");

  return (
    <a
      href={`https://wa.me/${phone}?text=${encodeURIComponent(text)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Probar demo por WhatsApp"
      onClick={() =>
        track('Contact', {
          content_name: 'WhatsApp Floating Button',
          source: 'landing_home',
        })
      }
      className="
        fixed bottom-8 right-6 z-[9999]
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

      {/* Tooltip */}
      <span
        className="
          absolute
          bottom-full left-1/2 -translate-x-1/2
          mb-3
          bg-white text-black text-xs
          px-3 py-2 rounded-lg
          shadow-md
          whitespace-nowrap

          md:bottom-auto md:left-auto md:mb-0
          md:top-1/2 md:-translate-y-1/2
          md:right-20 md:translate-x-0
        "
      >
        {t("waDemo.tooltip")}

        {/* Flechita */}
        <span
          className="
            absolute left-1/2 -translate-x-1/2 top-full
            w-0 h-0
            border-l-6 border-l-transparent
            border-r-6 border-r-transparent
            border-t-6 border-t-white

            md:left-full md:top-1/2 md:-translate-y-1/2
            md:border-t-transparent md:border-l-6 md:border-l-white
            md:border-r-0
          "
        />
      </span>
    </a>
  );
}
