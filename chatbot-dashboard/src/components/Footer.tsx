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
        © {new Date().getFullYear()} Aamy.ai — Automatización de atención 24/7 para negocios.
      </p>

      <div className="mt-2 flex justify-center gap-4">
        <Link href="/privacy-policy" className="underline hover:text-purple-400 transition">
          Política de Privacidad
        </Link>
        <span>|</span>
        <Link href="/terms-of-service" className="underline hover:text-purple-400 transition">
          Términos de Servicio
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
    </footer>
  );
}
