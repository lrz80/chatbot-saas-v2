"use client";

import { useI18n } from "../i18n/LanguageProvider";

const LANG_OPTIONS = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "pt", label: "Português" },
] as const;

export default function LangToggle() {
  const { lang, setLang } = useI18n();

  return (
    <div className="relative">
      <label htmlFor="language-select" className="sr-only">
        Select language
      </label>

      <select
        id="language-select"
        value={lang}
        onChange={(event) => setLang(event.target.value as typeof lang)}
        className="cursor-pointer rounded-xl border border-white/20 bg-black/40 px-3 py-2 pr-8 text-sm font-semibold text-white outline-none transition hover:border-white/50 focus:border-purple-400"
      >
        {LANG_OPTIONS.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="bg-[#0f0a1e] text-white"
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}