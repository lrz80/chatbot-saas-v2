// src/components/Footer.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Footer() {
  const pathname = usePathname();

  const showDeleteLink = pathname !== '/';

  return (
    <footer className="text-center text-gray-400 text-xs mt-12 py-6">
      <p>
        © {new Date().getFullYear()} Aamy.ai — Plataforma de atención automática 24/7 para negocios.
      </p>

      <div className="mt-2 flex justify-center gap-4">
        <Link href="/terms-of-service" className="underline hover:text-purple-400 transition">
          Términos de Servicio
        </Link>
        <span>|</span>
        <Link href="/privacy-policy" className="underline hover:text-purple-400 transition">
          Política de Privacidad
        </Link>

        {showDeleteLink && (
          <>
            <span>|</span>
            <Link href="/delete-account" className="underline hover:text-red-400 transition">
              Eliminar Cuenta
            </Link>
          </>
        )}
      </div>

      <p className="mt-3 text-[10px] text-gray-500 max-w-xl mx-auto">
        Aamy responde con la información proporcionada por cada negocio. Los resultados pueden variar según uso y configuración.
      </p>
    </footer>
  );
}
