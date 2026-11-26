import React, { createContext, useContext, useEffect, useState } from 'react';
import { LanguageCode } from '../types/crm';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  language: 'vi',
  setLanguage: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('onecrm_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [language, setLanguage] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('onecrm_lang');
    return saved === 'en' ? 'en' : 'vi';
  });

  useEffect(() => {
    localStorage.setItem('onecrm_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('onecrm_lang', language);
  }, [language]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, language, setLanguage }}>
      {children}
    </ThemeContext.Provider>
  );
};
