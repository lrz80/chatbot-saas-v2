// src/components/Footer.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Footer() {
  const pathname = usePathname();
  const showDeleteLink = pathname !== '/';

  return (
    <footer className="text-center text-gray-400 text-xs mt-16 py-10 border-t border-white/10 bg-white/5 backdrop-blur-md">
      {/* Tagline compacto (posicionamiento premium) */}
      <p className="text-sm text-white/80 font-semibold mb-3">
        Aamy.ai — IA conversacional omnicanal para ventas, agenda y seguimiento.
      </p>

      {/* Links legales */}
      <div className="flex justify-center gap-4 text-xs mb-4">
        <Link
          href="/terms-of-service"
          className="underline hover:text-purple-300 transition"
        >
          Términos de Servicio
        </Link>

        <span>|</span>

        <Link
          href="/privacy-policy"
          className="underline hover:text-purple-300 transition"
        >
          Política de Privacidad
        </Link>

        {showDeleteLink && (
          <>
            <span>|</span>
            <Link
              href="/delete-account"
              className="underline hover:text-red-400 transition"
            >
              Eliminar Cuenta
            </Link>
          </>
        )}
      </div>

      {/* Nota legal (más clara y profesional) */}
      <p className="text-[10px] text-gray-400 max-w-xl mx-auto mb-3 px-4 leading-relaxed">
        Aamy procesa mensajes usando la información configurada por cada negocio y las reglas de su sector.
        Los resultados pueden variar según la configuración, el tipo de negocio y el volumen de mensajes.
      </p>

      {/* Derechos reservados */}
      <p className="text-[10px] text-gray-500">
        © {new Date().getFullYear()} Aamy.ai — Todos los derechos reservados.
      </p>
    </footer>
  );
}
