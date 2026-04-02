// frontend/src/components/LanguageSwitcher.tsx
"use client";

import { useLanguage } from "../context/LanguageContext";
import { Globe } from "lucide-react";
import { useState } from "react";

export default function LanguageSwitcher() {
  const { language, toggleLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = language === 'am' ? 'አማርኛ' : 'English';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
      >
        <Globe className="w-5 h-5" />
        <span className="text-sm">{currentLanguage}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <button
              onClick={() => {
                if (language !== 'en') toggleLanguage();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-t-lg"
            >
              English
            </button>
            <button
              onClick={() => {
                if (language !== 'am') toggleLanguage();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-b-lg"
            >
              አማርኛ
            </button>
          </div>
        </>
      )}
    </div>
  );
}