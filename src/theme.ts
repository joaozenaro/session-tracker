import { createTheme } from '@mui/material/styles';
import { enUS, ptBR } from '@mui/material/locale';

export const localeMap: Record<string, typeof enUS> = {
  en: enUS,
  pt: ptBR,
};

export const createAppTheme = (mode: 'light' | 'dark' = 'light', locale: string = 'en') => {
  const localeData = localeMap[locale] || enUS;

  return createTheme(
    {
      palette: {
        mode,
        primary: {
          main: '#1976d2',
        },
        secondary: {
          main: '#9c27b0',
        },
      },
      typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      },
    },
    localeData
  );
};

export default createAppTheme('light', 'en');
