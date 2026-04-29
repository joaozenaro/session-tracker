import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import CircularProgress from '@mui/material/CircularProgress';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { useAppContext } from '../lib/AppContext';
import { t } from '../lib/i18n';
import type { Client } from '../types/client';
import { useUpdateClient } from '../hooks/useClients';
import RichTextEditor from './RichTextEditor';

interface ClientTextEditorDrawerProps {
  open: boolean;
  client: Client | null;
  type: 'plan' | 'medications';
  onClose: () => void;
}

export default function ClientTextEditorDrawer({
  open,
  client,
  type,
  onClose,
}: ClientTextEditorDrawerProps) {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const { locale } = useAppContext();
  const updateClient = useUpdateClient();

  const [prevClient, setPrevClient] = useState(client);
  const [prevType, setPrevType] = useState(type);
  const [content, setContent] = useState(client?.[type] || '');

  if (client !== prevClient || type !== prevType) {
    setPrevClient(client);
    setPrevType(type);
    setContent(client?.[type] || '');
  }

  const handleSave = async () => {
    if (!client) return;
    await updateClient.mutateAsync({
      id: client.id,
      payload: { [type]: content },
    });
    onClose();
  };

  const title = type === 'plan' ? t(locale, 'plan') : t(locale, 'medications');
  const saveLabel = type === 'plan' ? t(locale, 'savePlan') : t(locale, 'saveMedications');

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: isSmall ? '100vw' : 600,
          maxWidth: '100vw',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2.5,
          py: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1, fontSize: '1rem' }}>
          {title} - {client?.name}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box
        sx={{ flexGrow: 1, p: 2.5, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder={type === 'medications' ? t(locale, 'noMedications') : ''}
        />
      </Box>

      <Box sx={{ px: 2.5, py: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1.5 }}>
        <Button variant="outlined" onClick={onClose} fullWidth disabled={updateClient.isPending}>
          {t(locale, 'cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSave()}
          fullWidth
          disabled={updateClient.isPending}
          disableElevation
        >
          {updateClient.isPending ? <CircularProgress size={20} color="inherit" /> : saveLabel}
        </Button>
      </Box>
    </Drawer>
  );
}
