import { createContext, useContext, useState, ReactNode } from "react";
import { translations } from "../translations/index";

type LanguageKey = 'english' | 'hindi' | 'tamil' | 'telugu' | 'kannada' | 'malayalam' | 'marathi';

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [currentLanguage, setCurrentLanguage] =
    useState<string>('english');

  const setLanguage = (language: string) => {
    setCurrentLanguage(language);
  };

  // Translation function
  const t = (key: string): string => {
    const langKey = currentLanguage as keyof typeof translations;
    const langTranslations = translations[langKey] || translations.english;
    
    // Handle nested keys (e.g., "homepage.getStarted")
    const keys = key.split('.');
    let value: any = langTranslations;
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }
    
    // Return the translation or the key if not found
    return typeof value === 'string' ? value : key;
  };

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
