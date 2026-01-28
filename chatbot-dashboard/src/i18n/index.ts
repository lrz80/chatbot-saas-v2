import es from "./messages/es.json";
import en from "./messages/en.json";

export type Lang = "es" | "en";

const DICTS: Record<Lang, Record<string, string>> = { es, en };

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
  // ✅ Si falta en EN, cae a ES; si falta en ES, devuelve key (nunca rompe UI)
  return DICTS[lang]?.[key] ?? DICTS.es?.[key] ?? key;
}

