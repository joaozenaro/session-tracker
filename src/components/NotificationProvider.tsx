import React, { useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Snackbar, Alert } from '@mui/material';
import type { AlertColor } from '@mui/material';
import { NotificationContext } from '../lib/NotificationContext';
import { notificationEventBus } from '../lib/eventBus';
import type { NotificationEvent } from '../lib/eventBus';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<AlertColor>('info');

  const showNotification = useCallback((msg: string, t: AlertColor = 'info') => {
    setMessage(msg);
    setType(t);
    setOpen(true);
  }, []);

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  useEffect(() => {
    // Subscribe to global notification events
    const unsubscribe = notificationEventBus.subscribe((event: NotificationEvent) => {
      showNotification(event.message, event.type as AlertColor);
    });
    return unsubscribe;
  }, [showNotification]);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ zIndex: 2000 }} // Ensure it's on top of everything
      >
        <Alert
          onClose={handleClose}
          severity={type}
          variant="filled"
          sx={{ width: '100%', boxShadow: (theme) => theme.shadows[6] }}
        >
          {message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}
