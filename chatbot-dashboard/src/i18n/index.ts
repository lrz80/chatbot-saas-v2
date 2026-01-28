import es from "./messages/es.json";
import en from "./messages/en.json";

export type Lang = "es" | "en";

interface Dict {
  [key: string]: string | Dict;
}

const DICTS: Record<Lang, Dict> = { es, en };

export function getLangFromCookieClient(): Lang {
  if (typeof document === "undefined") return "es";
  const m = document.cookie.match(/(?:^|;\s*)lang=(es|en)(?:;|$)/i);
  const v = (m?.[1] || "es").toLowerCase();
  return v === "en" ? "en" : "es";
}

export function setLangCookieClient(lang: Lang) {
  document.cookie = `lang=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function t(key: string, lang: Lang): string {
  const v = DICTS[lang]?.[key] ?? DICTS.es?.[key];
  return typeof v === "string" ? v : key;
}

