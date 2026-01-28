// src/components/Footer.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from "../i18n/LanguageProvider";

export default function Footer() {
  const { t } = useI18n();
  const pathname = usePathname();
  const showDeleteLink = pathname !== '/';

  return (
    <footer className="text-center text-gray-400 text-xs mt-16 py-10 border-t border-white/10 bg-white/5 backdrop-blur-md">
      {/* Tagline compacto (posicionamiento premium) */}
      <p className="text-sm text-white/80 font-semibold mb-3">
        {t("footer.tagline")}
      </p>

      {/* Links legales */}
      <div className="flex justify-center gap-4 text-xs mb-4">
        <Link
          href="/terms-of-service"
          className="underline hover:text-purple-300 transition"
        >
          {t("footer.terms")}
        </Link>

        <span>|</span>

        <Link
          href="/privacy-policy"
          className="underline hover:text-purple-300 transition"
        >
          {t("footer.privacy")}
        </Link>

        {showDeleteLink && (
          <>
            <span>|</span>
            <Link
              href="/delete-account"
              className="underline hover:text-red-400 transition"
            >
              {t("footer.delete")}
            </Link>
          </>
        )}
      </div>

      {/* Nota legal (más clara y profesional) */}
      <p className="text-[10px] text-gray-400 max-w-xl mx-auto mb-3 px-4 leading-relaxed">
        {t("footer.disclaimer")}
      </p>

      {/* Derechos reservados */}
      <p className="text-[10px] text-gray-500">
        © {new Date().getFullYear()} Aamy.ai — {t("footer.rights")}
      </p>
    </footer>
  );
}
