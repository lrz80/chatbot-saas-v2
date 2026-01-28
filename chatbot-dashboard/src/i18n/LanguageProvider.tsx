"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import type { Lang } from "./index";
import { getLangFromCookieClient, setLangCookieClient, t as translate } from "./index";

type I18nCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const Ctx = createContext<I18nCtx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => getLangFromCookieClient());

  const setLang = (l: Lang) => {
    setLangState(l);
    setLangCookieClient(l);
  };

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: (key: string, vars?: Record<string, string | number>) => translate(key, lang, vars),
    }),
    [lang]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used inside LanguageProvider");
  return v;
}
