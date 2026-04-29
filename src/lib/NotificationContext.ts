import { createContext } from 'react';
import type { AlertColor } from '@mui/material';

export interface NotificationContextType {
  showNotification: (message: string, type?: AlertColor) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
