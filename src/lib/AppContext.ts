import { createContext, useContext } from 'react';
import type { locales } from './i18n';

type Locale = (typeof locales)[number];

export interface AppContextType {
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark') => void;
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
