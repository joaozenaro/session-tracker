import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import App from './App';
import { notificationEventBus } from './lib/eventBus';
import { t } from './lib/i18n';
import type { Locale } from './lib/i18n';

// Roboto font (required by MUI)
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: (_data, _variables, _context, mutation) => {
      // Skip if explicitly requested not to show notification (using meta)
      if (mutation.meta?.hideSuccessNotification) return;

      const locale = (localStorage.getItem('app-locale') as Locale) || 'en';
      notificationEventBus.emit({
        message: t(locale, 'actionSuccess'),
        type: 'success',
      });
    },
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.hideErrorNotification) return;

      const locale = (localStorage.getItem('app-locale') as Locale) || 'en';
      const message = error instanceof Error ? error.message : t(locale, 'actionError');

      notificationEventBus.emit({
        message,
        type: 'error',
      });
    },
  }),
  defaultOptions: {
    queries: {
      // Retry once on error (Tauri commands may transiently fail on first load)
      retry: 1,
      staleTime: 1000 * 30, // 30 s
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
