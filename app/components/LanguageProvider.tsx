"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "fr" | "en";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "fr",
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Restore persisted preference
  useEffect(() => {
    const stored = localStorage.getItem("healthlex-lang");
    if (stored === "en" || stored === "fr") setLangState(stored);
  }, []);

  // Keep <html lang="…"> in sync
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("healthlex-lang", l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
