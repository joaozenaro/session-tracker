import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useAppContext } from '../lib/AppContext';
import { t } from '../lib/i18n';
import type { Client } from '../types/client';
import FilePreview from '../components/FilePreview';

const getFileIcon = (name: string) => {
  if (name.toLowerCase().endsWith('.pdf')) return <PictureAsPdfIcon color="error" />;
  if (name.toLowerCase().endsWith('.docx')) return <DescriptionIcon color="primary" />;
  return <DescriptionIcon />;
};

const isSupported = (name: string) => {
  const low = name.toLowerCase();
  return low.endsWith('.pdf') || low.endsWith('.docx');
};

export default function ClientFilesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { locale } = useAppContext();

  const [client, setClient] = useState<Client | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const fetchClient = async () => {
      if (!id) return;
      try {
        const result = await invoke<Client>('get_client', { id });
        setClient(result);
      } catch (err) {
        console.error('Error loading client:', err);
        navigate('/clients');
      }
    };
    void fetchClient();
  }, [id, navigate]);

  const loadFiles = useCallback(async () => {
    if (!client?.folder_name) return;
    try {
      const result = await invoke<string[]>('list_client_files', {
        folderName: client.folder_name,
      });
      setFiles(result);
    } catch (err) {
      console.error('Error loading files:', err);
    }
  }, [client]);

  useEffect(() => {
    if (client) {
      const timer = setTimeout(() => {
        void loadFiles();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [client, loadFiles]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      try {
        const win = getCurrentWindow();
        unlisten = await win.onDragDropEvent((event) => {
          if (event.payload.type === 'drop') {
            setIsDragging(false);
            if (client) {
              const paths = event.payload.paths;
              const supportedPaths = paths.filter((p) => isSupported(p));

              if (supportedPaths.length > 0) {
                Promise.all(
                  supportedPaths.map((path) =>
                    invoke('copy_file_to_client', {
                      folderName: client.folder_name,
                      path,
                      locale,
                    })
                  )
                )
                  .then(() => {
                    void loadFiles();
                  })
                  .catch((err) => {
                    console.error('Error copying files:', err);
                  });
              }
            }
          } else if (event.payload.type === 'enter') {
            setIsDragging(true);
          } else if (event.payload.type === 'leave') {
            setIsDragging(false);
          }
        });
      } catch (err) {
        console.error('Error setting up native drag-drop listener:', err);
      }
    };

    if (client) {
      void setupListener();
    }

    return () => {
      if (unlisten) unlisten();
    };
  }, [client, loadFiles, locale]);

  const handleOpenFolder = async () => {
    if (!client) return;
    try {
      await invoke('open_client_folder', { folderName: client.folder_name });
    } catch (err) {
      console.error('Error opening folder:', err);
    }
  };

  const handleRename = async () => {
    if (!client || !renamingFile || !newName.trim()) return;
    try {
      await invoke('rename_client_file', {
        folderName: client.folder_name,
        oldName: renamingFile,
        newName: newName.trim(),
      });
      setRenamingFile(null);
      void loadFiles();
    } catch (err) {
      console.error('Error renaming file:', err);
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!client || !confirm(t(locale, 'deleteFormConfirm'))) return;
    try {
      await invoke('delete_client_file', { folderName: client.folder_name, name: fileName });
      if (selectedFile === fileName) setSelectedFile(null);
      void loadFiles();
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  };

  if (!client) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Simple Top Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <IconButton onClick={() => navigate('/clients')} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
          {client.name} - {t(locale, 'files')}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<FolderOpenIcon />}
          onClick={() => void handleOpenFolder()}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          {t(locale, 'openFolder')}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Drag & Drop Hint Overlay */}
        {isDragging && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 100,
              bgcolor: 'rgba(25, 118, 210, 0.1)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '4px dashed',
              borderColor: 'primary.main',
              m: 2,
              borderRadius: 4,
            }}
          >
            <Paper
              elevation={0}
              sx={{ p: 4, textAlign: 'center', borderRadius: 4, bgcolor: 'background.paper' }}
            >
              <FolderOpenIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                {t(locale, 'dropFiles')}
              </Typography>
              <Typography color="text.secondary">{t(locale, 'dropSupported')}</Typography>
            </Paper>
          </Box>
        )}

        {/* File List Section */}
        <Box
          sx={{
            width: selectedFile ? (sidebarCollapsed ? 64 : 400) : '100%',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default',
            borderRight: selectedFile ? 1 : 0,
            borderColor: 'divider',
            transition: 'width 0.2s ease-in-out',
            overflow: 'hidden',
          }}
        >
          {selectedFile && (
            <Box
              sx={{
                p: 1,
                display: 'flex',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-end',
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <IconButton size="small" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </IconButton>
            </Box>
          )}
          <List sx={{ p: 0, overflowY: 'auto', flexGrow: 1 }}>
            {files.length === 0 ? (
              <Box sx={{ p: 8, textAlign: 'center', color: 'text.disabled' }}>
                <FolderOpenIcon sx={{ fontSize: 48, mb: 2, opacity: 0.2 }} />
                <Typography variant="body1">{t(locale, 'noFilesFound')}</Typography>
              </Box>
            ) : (
              files.map((file) => (
                <ListItem
                  key={file}
                  disablePadding
                  secondaryAction={
                    !sidebarCollapsed && (
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingFile(file);
                            setNewName(file);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDelete(file);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )
                  }
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: selectedFile === file ? 'action.selected' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <ListItemButton
                    onClick={() => (isSupported(file) ? setSelectedFile(file) : null)}
                    disabled={!isSupported(file)}
                    sx={{ py: 2, px: 2 }}
                  >
                    <ListItemIcon sx={{ minWidth: sidebarCollapsed ? 0 : 44 }}>
                      {getFileIcon(file)}
                    </ListItemIcon>
                    {!sidebarCollapsed && (
                      <ListItemText
                        primary={file}
                        primaryTypographyProps={{
                          variant: 'body2',
                          sx: {
                            fontWeight: selectedFile === file ? 600 : 400,
                            wordBreak: 'break-all',
                          },
                        }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              ))
            )}
          </List>
          {!sidebarCollapsed && (
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Typography variant="caption" color="text.secondary">
                {t(locale, 'supportedTypes')}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Preview Panel */}
        {selectedFile && (
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: 'grey.50' }}>
            <Box
              sx={{
                p: 1.5,
                px: 2,
                display: 'flex',
                alignItems: 'center',
                bgcolor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, flexGrow: 1 }} noWrap>
                {selectedFile}
              </Typography>
              <IconButton size="small" onClick={() => setSelectedFile(null)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <FilePreview folderName={client.folder_name} fileName={selectedFile} />
            </Box>
          </Box>
        )}
      </Box>

      {/* Rename Dialog */}
      <Dialog open={!!renamingFile} onClose={() => setRenamingFile(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 600 }}>{t(locale, 'renameFile')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            label={t(locale, 'fileName')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            sx={{ mt: 1 }}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setRenamingFile(null)}>{t(locale, 'cancel')}</Button>
          <Button onClick={() => void handleRename()} variant="contained" disableElevation>
            {t(locale, 'save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
