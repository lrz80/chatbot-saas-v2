'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="text-center text-gray-400 text-xs mt-12 py-6">
      <p>
        © {new Date().getFullYear()} Aamy.ai — Todos los derechos reservados.
      </p>
      <div className="mt-2 flex justify-center gap-4">
        <Link
          href="/dashboard/privacy-policy"
          className="underline hover:text-purple-400 transition"
        >
          Política de Privacidad
        </Link>
        <span>|</span>
        <Link
          href="/dashboard/terms-of-service"
          className="underline hover:text-purple-400 transition"
        >
          Términos de Servicio
        </Link>
      </div>
    </footer>
  );
}
