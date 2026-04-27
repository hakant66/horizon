"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { type I18nKey, type Locale, translate } from "@/lib/i18n";

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: I18nKey) => string;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "tr";
    const saved = window.localStorage.getItem("horizon-locale");
    return saved === "tr" || saved === "en" ? saved : "tr";
  });

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem("horizon-locale", next);
  };

  const value = useMemo(
    () => ({ locale, setLocale, t: (key: I18nKey) => translate(locale, key) }),
    [locale],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useI18n must be used within LanguageProvider");
  }
  return context;
}
