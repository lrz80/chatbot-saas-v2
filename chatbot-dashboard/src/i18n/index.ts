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

export function t(
  key: string,
  lang: Lang,
  vars?: Record<string, string | number>
): string {
  const value = DICTS[lang]?.[key] ?? DICTS.es?.[key] ?? key;

  let out = typeof value === "string" ? value : key;

  // Sustituir variables como {{name}} o {{seconds}}
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replaceAll(`{{${k}}}`, String(v));
    }
  }

  return out;
}
