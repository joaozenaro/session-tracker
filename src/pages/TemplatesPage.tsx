import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';

import type { Form } from '../types/form';
import { useTemplates, useDeleteForm } from '../hooks/useForms';
import { useAppContext } from '../lib/AppContext';
import { t } from '../lib/i18n';

export default function TemplatesPage() {
  const { locale } = useAppContext();
  const navigate = useNavigate();
  const { data: templates = [], isLoading, error } = useTemplates();
  const deleteForm = useDeleteForm();

  const handleAdd = () => {
    navigate('/templates/new');
  };

  const handleEdit = (template: Form) => {
    navigate(`/templates/edit/${template.id}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t(locale, 'deleteTemplateConfirm'))) return;
    await deleteForm.mutateAsync(id);
  };

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
        <AssignmentIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
        <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
          {t(locale, 'globalTemplates')}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        {isLoading && <CircularProgress size={16} />}
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          disableElevation
          sx={{ textTransform: 'none' }}
        >
          {t(locale, 'createTemplate')}
        </Button>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2.5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message}
          </Alert>
        )}
        {templates.length === 0 && !isLoading ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.disabled' }}>
            <AssignmentIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
            <Typography variant="body1" sx={{ mb: 2 }}>
              {t(locale, 'noTemplatesFound')}
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              disableElevation
              sx={{ textTransform: 'none' }}
            >
              {t(locale, 'createTemplate')}
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            {templates.map((template) => (
              <Paper
                key={template.id}
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  transition: 'box-shadow 150ms',
                  '&:hover': { boxShadow: 2 },
                  position: 'relative',
                }}
              >
                <Box sx={{ position: 'absolute', top: 10, right: 10, display: 'flex' }}>
                  <IconButton size="small" onClick={() => handleEdit(template)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => void handleDelete(template.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, pr: 6 }}>
                  {template.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40 }}>
                  {template.description || t(locale, 'noDescription')}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
