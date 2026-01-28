"use client";

import { LanguageProvider } from "../i18n/LanguageProvider";

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
