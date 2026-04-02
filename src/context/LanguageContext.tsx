"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { translations, TranslationKey } from "../utils/translations";
import i18n from "../i18n";

type Language = "en" | "am";

interface LanguageContextProps {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [languageState, setLanguageState] = useState<Language>("en");

  // Load language preference from local storage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage === "en" || savedLanguage === "am") {
      setLanguageState(savedLanguage as Language);
    }
  }, []);

  const toggleLanguage = () => {
    setLanguageState((prev) => {
      const next = prev === "en" ? "am" : "en";
      localStorage.setItem("language", next);
      try {
        i18n.changeLanguage(next);
      } catch (_) {}
      return next;
    });
  };

  const setLanguage = (lang: Language) => {
    if (lang !== "en" && lang !== "am") return;
    setLanguageState(lang);
    localStorage.setItem("language", lang);
    try {
      i18n.changeLanguage(lang);
    } catch (err) {
      // ignore
    }
  };

  const t = (key: TranslationKey): string => {
    const lang = languageState;
    const langPack = (translations as any)[lang] as Record<string, string> | undefined;
    const enPack = (translations as any)["en"] as Record<string, string> | undefined;
    if (langPack && key in langPack) return langPack[key];
    if (enPack && key in enPack) return enPack[key];
    return String(key);
  };

  // ensure i18n initialized language matches
  useEffect(() => {
    try {
      i18n.changeLanguage(languageState);
    } catch (_) {}
  }, [languageState]);

  return (
    <LanguageContext.Provider value={{ language: languageState, toggleLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextProps => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
