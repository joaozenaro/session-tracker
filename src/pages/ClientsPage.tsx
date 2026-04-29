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
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Slider from '@mui/material/Slider';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PhoneIcon from '@mui/icons-material/Phone';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import MedicationIcon from '@mui/icons-material/Medication';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Badge from '@mui/material/Badge';
import { MuiTelInput } from 'mui-tel-input';
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
import ClientFormsDrawer from '../components/forms/ClientFormsDrawer';
import ClientTextEditorDrawer from '../components/ClientTextEditorDrawer';

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

  const parseHue = (colorStr?: string) => {
    if (!colorStr) return Math.floor(Math.random() * 360);
    const match = colorStr.match(/hsl\((\d+),/);
    return match ? parseInt(match[1]) : 200; // Default if not HSL
  };

  const [hue, setHue] = useState(() => parseHue(client?.color));

  const color = `hsl(${hue}, 80%, 70%)`;

  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  const saving = createClient.isPending || updateClient.isPending;

  const handleSave = async () => {
    if (!name.trim()) return;
    const payload: ClientInsert = {
      name: name.trim(),
      telephone: telephone.trim(),
      color,
    };
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
        <MuiTelInput
          label={t(locale, 'telephone')}
          value={telephone}
          onChange={setTelephone}
          defaultCountry={locale === 'pt' ? 'BR' : 'US'}
          fullWidth
          size="small"
        />

        <Box sx={{ mt: 1 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}
          >
            {t(locale, 'color')}
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                bgcolor: color,
                border: 1,
                borderColor: 'divider',
              }}
            />
          </Typography>
          <Slider
            value={hue}
            onChange={(_, v) => setHue(v as number)}
            min={0}
            max={360}
            sx={{
              height: 10,
              '& .MuiSlider-track': { display: 'none' },
              '& .MuiSlider-thumb': {
                width: 24,
                height: 24,
                bgcolor: color,
                border: 3,
                borderColor: 'white',
                boxShadow: '0 0 10px rgba(0,0,0,0.3)',
                '&:hover, &.Mui-active, &.Mui-focusVisible': {
                  boxShadow: '0 0 15px rgba(0,0,0,0.4)',
                },
              },
              '& .MuiSlider-rail': {
                opacity: 1,
                height: 10,
                borderRadius: 5,
                background:
                  'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
              },
            }}
          />
        </Box>
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

interface ClientMenuProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
  locale: Locale;
}

function ClientMenu({ client, onEdit, onDelete, locale }: ClientMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton size="small" onClick={handleClick}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem
          onClick={() => {
            onEdit(client);
            handleClose();
          }}
          sx={{ fontSize: '0.85rem' }}
        >
          <EditIcon fontSize="inherit" sx={{ mr: 1, color: 'text.secondary' }} />
          {t(locale, 'edit')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            void onDelete(client.id);
            handleClose();
          }}
          sx={{ fontSize: '0.85rem', color: 'error.main' }}
        >
          <DeleteIcon fontSize="inherit" sx={{ mr: 1, color: 'inherit' }} />
          {t(locale, 'delete')}
        </MenuItem>
      </Menu>
    </>
  );
}

export default function ClientsPage() {
  const theme = useTheme();
  const { locale } = useAppContext();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formsDrawerOpen, setFormsDrawerOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formsClient, setFormsClient] = useState<Client | null>(null);
  const [textEditorOpen, setTextEditorOpen] = useState(false);
  const [textEditorType, setTextEditorType] = useState<'plan' | 'medications'>('plan');
  const [textEditorClient, setTextEditorClient] = useState<Client | null>(null);
  const [addKey, setAddKey] = useState(0);

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
    setAddKey((prev) => prev + 1);
    setFormOpen(true);
  };

  const handleOpenForms = (client: Client) => {
    setFormsClient(client);
    setFormsDrawerOpen(true);
  };

  const handleOpenTextEditor = (client: Client, type: 'plan' | 'medications') => {
    setTextEditorClient(client);
    setTextEditorType(type);
    setTextEditorOpen(true);
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
              gap: 2.5,
            }}
          >
            {filtered.map((client) => (
              <Paper
                key={client.id}
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Header Section */}
                <Box sx={{ p: 2, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: client.color || 'primary.main',
                      color: 'text.primary',
                      width: 48,
                      height: 48,
                      fontSize: '1rem',
                      fontWeight: 700,
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  >
                    {getInitials(client.name)}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.2, mb: 0.5 }}
                      noWrap
                    >
                      {client.name}
                    </Typography>
                    {client.telephone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PhoneIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {client.telephone}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <Chip
                        label={`${sessionCounts[client.id] ?? 0} ${t(locale, 'sessions').toLowerCase()}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', height: 18, borderStyle: 'dashed' }}
                      />
                    </Box>
                  </Box>
                  <ClientMenu
                    client={client}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    locale={locale}
                  />
                </Box>

                {/* Footer Toolbar */}
                <Box
                  sx={{
                    mt: 'auto',
                    px: 1.5,
                    py: 1,
                    bgcolor:
                      theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'grey.50',
                    borderTop: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                  }}
                >
                  <Tooltip title={t(locale, 'plan')}>
                    <IconButton size="small" onClick={() => handleOpenTextEditor(client, 'plan')}>
                      <HistoryEduIcon fontSize="small" color="action" />
                    </IconButton>
                  </Tooltip>
                  <Divider orientation="vertical" flexItem sx={{ height: 20, my: 'auto' }} />
                  <Tooltip title={t(locale, 'medications')}>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenTextEditor(client, 'medications')}
                    >
                      <Badge
                        variant="dot"
                        color="warning"
                        invisible={!!client.medications && client.medications !== '<p></p>'}
                      >
                        <MedicationIcon fontSize="small" color="action" />
                      </Badge>
                    </IconButton>
                  </Tooltip>
                  <Divider orientation="vertical" flexItem sx={{ height: 20, my: 'auto' }} />
                  <Tooltip title={t(locale, 'forms')}>
                    <IconButton size="small" onClick={() => handleOpenForms(client)}>
                      <AssignmentIcon fontSize="small" color="action" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Box>

      <ClientForm
        key={editingClient ? editingClient.id : `new-${addKey}`}
        open={formOpen}
        client={editingClient}
        onClose={() => setFormOpen(false)}
        locale={locale}
      />

      <ClientFormsDrawer
        open={formsDrawerOpen}
        client={formsClient}
        onClose={() => setFormsDrawerOpen(false)}
      />

      <ClientTextEditorDrawer
        open={textEditorOpen}
        client={textEditorClient}
        type={textEditorType}
        onClose={() => setTextEditorOpen(false)}
      />
    </Box>
  );
}
