import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

import type { Client } from '../../types/client';
import type { Form } from '../../types/form';
import {
  useTemplates,
  useClientForms,
  useCopyTemplateToClient,
  useDeleteForm,
} from '../../hooks/useForms';
import FormFiller from './FormFiller';
import TemplateBuilder from './TemplateBuilder';
import { useAppContext } from '../../lib/AppContext';
import { t } from '../../lib/i18n';

interface ClientFormsDrawerProps {
  open: boolean;
  client: Client | null;
  onClose: () => void;
}

export default function ClientFormsDrawer({ open, client, onClose }: ClientFormsDrawerProps) {
  const { locale } = useAppContext();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const { data: forms = [], isLoading } = useClientForms(client?.id || '-1');
  const { data: templates = [] } = useTemplates();
  const copyTemplate = useCopyTemplateToClient();
  const deleteForm = useDeleteForm();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const [activeForm, setActiveForm] = useState<Form | null>(null);
  const [editingFormStructure, setEditingFormStructure] = useState<Form | null>(null);

  if (!client) return null;

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplateId) return;
    const newForm = await copyTemplate.mutateAsync({
      clientId: client.id,
      templateId: selectedTemplateId,
    });
    setCreateDialogOpen(false);
    setActiveForm(newForm); // Open answer mode immediately
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t(locale, 'deleteFormConfirm'))) return;
    await deleteForm.mutateAsync(id);
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: isSmall ? '100vw' : 450,
            maxWidth: '100vw',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2.5, py: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
            {t(locale, 'formsFor')} {client.name}
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ flexGrow: 1, p: 2.5, overflowY: 'auto' }}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              disableElevation
            >
              {t(locale, 'fillNewForm')}
            </Button>
          </Box>

          {isLoading ? (
            <CircularProgress />
          ) : forms.length === 0 ? (
            <Typography color="text.disabled" sx={{ textAlign: 'center', mt: 4 }}>
              {t(locale, 'noFormsYet')}
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {forms.map((f) => (
                <Paper
                  key={f.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    position: 'relative',
                  }}
                  onClick={() => setActiveForm(f)}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, pr: 4 }}>
                    {f.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(f.created_at).toLocaleDateString()}
                  </Typography>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDelete(f.id);
                    }}
                    sx={{ position: 'absolute', top: 10, right: 10 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      </Drawer>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t(locale, 'selectTemplate')}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {templates.length === 0 ? (
              <Typography color="text.secondary">{t(locale, 'noGlobalTemplates')}</Typography>
            ) : (
              <Select
                fullWidth
                size="small"
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                displayEmpty
              >
                <MenuItem value="" disabled>
                  <em>{t(locale, 'selectTemplatePlaceholder')}</em>
                </MenuItem>
                {templates.map(t => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.title}
                  </MenuItem>
                ))}
              </Select>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>{t(locale, 'cancel')}</Button>
          <Button
            variant="contained"
            disableElevation
            disabled={!selectedTemplateId || copyTemplate.isPending}
            onClick={() => void handleCreateFromTemplate()}
          >
            {copyTemplate.isPending ? t(locale, 'creating') : t(locale, 'createForm')}
          </Button>
        </DialogActions>
      </Dialog>

      {activeForm && (
        <FormFiller
          form={activeForm}
          onClose={() => setActiveForm(null)}
          onEditStructure={() => setEditingFormStructure(activeForm)}
        />
      )}

      {editingFormStructure && (
        <TemplateBuilder
          open={true}
          template={editingFormStructure}
          onClose={() => setEditingFormStructure(null)}
        />
      )}
    </>
  );
}
