// src/i18n/index.ts
import es from "./messages/es.json";
import en from "./messages/en.json";

export type UiLang = string;


interface Dict {
  [key: string]: string | Dict;
}

const DEFAULT_UI_LANG = "es";

const DICTS: Record<string, Dict> = {
  es,
  en,
};

function normalizeLang(value: string | null | undefined): string {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return DEFAULT_UI_LANG;

  const normalized = raw.replace("_", "-").split("-")[0]?.trim();
  return normalized || DEFAULT_UI_LANG;
}

function parseCookieValue(cookieName: string, cookieHeader: string): string | null {
  const parts = String(cookieHeader || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

  for (const part of parts) {
    const eqIndex = part.indexOf("=");
    if (eqIndex <= 0) continue;

    const key = part.slice(0, eqIndex).trim();
    const value = part.slice(eqIndex + 1).trim();

    if (key === cookieName) {
      return decodeURIComponent(value);
    }
  }

  return null;
}

function resolveUiLang(candidate: string | null | undefined): string {
  const normalized = normalizeLang(candidate);

  if (DICTS[normalized]) {
    return normalized;
  }

  return DEFAULT_UI_LANG;
}

export function getLangFromCookieClient(): UiLang {
  if (typeof document === "undefined") {
    return DEFAULT_UI_LANG;
  }

  const cookieValue = parseCookieValue("lang", document.cookie);
  return resolveUiLang(cookieValue);
}

export function setLangCookieClient(lang: UiLang) {
  const resolved = resolveUiLang(lang);
  document.cookie = `lang=${encodeURIComponent(
    resolved
  )}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

function interpolateTemplate(
  template: string,
  vars?: Record<string, string | number>
): string {
  if (!vars) return template;

  let output = template;

  for (const [key, value] of Object.entries(vars)) {
    const stringValue = String(value);

    output = output.split(`{{${key}}}`).join(stringValue);
    output = output.split(`{${key}}`).join(stringValue);
  }

  return output;
}

export function t(
  key: string,
  lang: UiLang,
  vars?: Record<string, string | number>
): string {
  const resolvedLang = resolveUiLang(lang);
  const dict = DICTS[resolvedLang] || DICTS[DEFAULT_UI_LANG] || {};
  const fallbackDict = DICTS[DEFAULT_UI_LANG] || {};

  const value = dict[key] ?? fallbackDict[key] ?? key;
  const text = typeof value === "string" ? value : key;

  return interpolateTemplate(text, vars);
}