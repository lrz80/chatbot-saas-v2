"use client";

import { useI18n } from "../i18n/LanguageProvider";

export default function LangToggle() {
  const { lang, setLang } = useI18n();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setLang("es")}
        className={`px-2 py-1 rounded border border-white/20 hover:border-white/50 transition ${
          lang === "es" ? "opacity-100" : "opacity-60"
        }`}
      >
        ES
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`px-2 py-1 rounded border border-white/20 hover:border-white/50 transition ${
          lang === "en" ? "opacity-100" : "opacity-60"
        }`}
      >
        EN
      </button>
    </div>
  );
}
