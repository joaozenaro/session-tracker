import { useState } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from './theme';
import type { Locale } from './lib/i18n';
import { AppContext } from './lib/AppContext';
import Layout from './components/Layout';
import CalendarPage from './pages/CalendarPage';
import SessionsPage from './pages/SessionsPage';
import ClientsPage from './pages/ClientsPage';
import TemplatesPage from './pages/TemplatesPage';
import TemplateEditorPage from './pages/TemplateEditorPage';
import FormFillerPage from './pages/FormFillerPage';
import { NotificationProvider } from './components/NotificationProvider';

function AppProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('app-mode');
    return (saved as 'light' | 'dark') || 'light';
  });

  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem('app-locale');
    return (saved as Locale) || 'en';
  });

  const handleSetMode = (newMode: 'light' | 'dark') => {
    setMode(newMode);
    localStorage.setItem('app-mode', newMode);
  };

  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem('app-locale', newLocale);
  };

  const theme = createAppTheme(mode, locale);

  return (
    <AppContext.Provider
      value={{
        mode,
        setMode: handleSetMode,
        locale,
        setLocale: handleSetLocale,
      }}
    >
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </ThemeProvider>
    </AppContext.Provider>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<CalendarPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/templates/new" element={<TemplateEditorPage />} />
            <Route path="/templates/edit/:id" element={<TemplateEditorPage />} />
            <Route path="/forms/fill/:id" element={<FormFillerPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
}
