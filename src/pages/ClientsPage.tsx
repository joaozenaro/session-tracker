import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PhoneIcon from '@mui/icons-material/Phone';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import { useAppContext } from '../lib/AppContext';
import { t } from '../lib/i18n';
import type { Client, ClientInsert } from '../types/client';
import type { Locale } from '../lib/i18n';
import {
  useClients,
  useSessionCounts,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from '../hooks/useClients';

function getInitials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  );
}

interface ClientFormProps {
  open: boolean;
  client: Client | null;
  onClose: () => void;
  locale: Locale;
}

function ClientForm({ open, client, onClose, locale }: ClientFormProps) {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const [name, setName] = useState(client?.name ?? '');
  const [telephone, setTelephone] = useState(client?.telephone ?? '');

  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  const saving = createClient.isPending || updateClient.isPending;

  const handleSave = async () => {
    if (!name.trim()) return;
    const payload: ClientInsert = { name: name.trim(), telephone: telephone.trim() };
    if (client) {
      await updateClient.mutateAsync({ id: client.id, payload });
    } else {
      await createClient.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: isSmall ? '100vw' : 400,
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
          {client ? t(locale, 'editClient') : t(locale, 'addClient')}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box
        sx={{
          flexGrow: 1,
          px: 2.5,
          pt: 3,
          pb: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
        }}
      >
        <TextField
          label={t(locale, 'fullName')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          autoFocus
          size="small"
        />
        <TextField
          label={t(locale, 'telephone')}
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          fullWidth
          size="small"
          placeholder="+1 (555) 000-0000"
        />
      </Box>
      <Box sx={{ px: 2.5, py: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1.5 }}>
        <Button variant="outlined" onClick={onClose} fullWidth disabled={saving}>
          {t(locale, 'cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSave()}
          fullWidth
          disabled={saving || !name.trim()}
          disableElevation
        >
          {saving ? (
            <CircularProgress size={20} color="inherit" />
          ) : client ? (
            t(locale, 'saveChanges')
          ) : (
            t(locale, 'addClient')
          )}
        </Button>
      </Box>
    </Drawer>
  );
}

export default function ClientsPage() {
  const { locale } = useAppContext();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const { data: clients = [], isLoading, error } = useClients();
  const { data: sessionCounts = {} } = useSessionCounts();
  const deleteClient = useDeleteClient();

  const handleDelete = async (id: string) => {
    if (!confirm(t(locale, 'deleteClientConfirm'))) return;
    await deleteClient.mutateAsync(id);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingClient(null);
    setFormOpen(true);
  };

  const filtered = clients.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.telephone.includes(search)
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flexShrink: 0,
        }}
      >
        <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
        <TextField
          placeholder={t(locale, 'search') + ' ' + t(locale, 'clients').toLowerCase() + '...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: 240 }}
        />
        <Box sx={{ flexGrow: 1 }} />
        <Chip
          label={`${filtered.length} ${t(locale, 'clients').toLowerCase()}`}
          size="small"
          variant="outlined"
        />
        {isLoading && <CircularProgress size={16} />}
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          disableElevation
          sx={{ textTransform: 'none' }}
        >
          {t(locale, 'addClient')}
        </Button>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2.5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message}
          </Alert>
        )}
        {filtered.length === 0 && !isLoading ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.disabled' }}>
            <PersonIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
            <Typography variant="body1">{t(locale, 'noClients')}</Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            {filtered.map((client) => (
              <Paper
                key={client.id}
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2,
                  transition: 'box-shadow 150ms',
                  '&:hover': { boxShadow: 2 },
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    width: 44,
                    height: 44,
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {getInitials(client.name)}
                </Avatar>
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    {client.name}
                  </Typography>
                  {client.telephone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <PhoneIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {client.telephone}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={`${sessionCounts[client.id] ?? 0} ${t(locale, 'sessions').toLowerCase()}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  </Box>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Tooltip title={t(locale, 'edit')}>
                    <IconButton size="small" onClick={() => handleEdit(client)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t(locale, 'delete')}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => void handleDelete(client.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Box>

      <ClientForm
        key={editingClient?.id ?? 'new'}
        open={formOpen}
        client={editingClient}
        onClose={() => setFormOpen(false)}
        locale={locale}
      />
    </Box>
  );
}
