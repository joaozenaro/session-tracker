import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import TableSortLabel from '@mui/material/TableSortLabel';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useAppContext } from '../lib/AppContext';
import { t } from '../lib/i18n';
import type { Session, SessionWithClient } from '../types/session';
import SessionDrawer from '../components/SessionDrawer';
import { useSessions } from '../hooks/useSessions';
import { useClients } from '../hooks/useClients';
import { useDeleteSession } from '../hooks/useSessions';

type SortField = 'session_date' | 'session_time' | 'client_name';
type SortDir = 'asc' | 'desc';

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${period}`;
}

export default function SessionsPage() {
  const { locale } = useAppContext();

  const { data: sessions = [], isLoading, error } = useSessions();
  const { data: clients = [] } = useClients();
  const deleteSession = useDeleteSession();

  const [filterClient, setFilterClient] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const [sortField, setSortField] = useState<SortField>('session_date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm(t(locale, 'deleteSessionConfirm'))) return;
    await deleteSession.mutateAsync(id);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(0);
  };

  const filtered = (sessions as SessionWithClient[])
    .filter((s) => {
      if (filterClient && s.client_id !== filterClient) return false;
      if (filterDateFrom && s.session_date < filterDateFrom) return false;
      if (filterDateTo && s.session_date > filterDateTo) return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'session_date') cmp = a.session_date.localeCompare(b.session_date);
      else if (sortField === 'session_time') cmp = a.session_time.localeCompare(b.session_time);
      else if (sortField === 'client_name')
        cmp = (a.client?.name ?? '').localeCompare(b.client?.name ?? '');
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const hasFilters = filterClient || filterDateFrom || filterDateTo;

  const clearFilters = () => {
    setFilterClient('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setPage(0);
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
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <FilterListIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
        <TextField
          select
          label={t(locale, 'client')}
          value={filterClient}
          onChange={(e) => {
            setFilterClient(e.target.value);
            setPage(0);
          }}
          size="small"
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">{t(locale, 'allClients')}</MenuItem>
          {clients.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label={t(locale, 'from')}
          type="date"
          value={filterDateFrom}
          onChange={(e) => {
            setFilterDateFrom(e.target.value);
            setPage(0);
          }}
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: 148 }}
        />
        <TextField
          label={t(locale, 'to')}
          type="date"
          value={filterDateTo}
          onChange={(e) => {
            setFilterDateTo(e.target.value);
            setPage(0);
          }}
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: 148 }}
        />
        {hasFilters && (
          <Button size="small" onClick={clearFilters} sx={{ textTransform: 'none' }}>
            {t(locale, 'clear')}
          </Button>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <Chip
          label={`${filtered.length} ${t(locale, 'sessions').toLowerCase()}`}
          size="small"
          variant="outlined"
        />
        {isLoading && <CircularProgress size={16} />}
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          disableElevation
          onClick={() => {
            setEditingSession(null);
            setDrawerOpen(true);
          }}
          sx={{ textTransform: 'none' }}
        >
          {t(locale, 'addSession')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mx: 2.5, mt: 1.5 }}>
          {error.message}
        </Alert>
      )}

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ flexGrow: 1, overflow: 'auto', borderRadius: 0 }}
      >
        <Table stickyHeader size="medium">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>
                <TableSortLabel
                  active={sortField === 'client_name'}
                  direction={sortField === 'client_name' ? sortDir : 'asc'}
                  onClick={() => handleSort('client_name')}
                >
                  {t(locale, 'client')}
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>
                <TableSortLabel
                  active={sortField === 'session_date'}
                  direction={sortField === 'session_date' ? sortDir : 'asc'}
                  onClick={() => handleSort('session_date')}
                >
                  {t(locale, 'date')}
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>
                <TableSortLabel
                  active={sortField === 'session_time'}
                  direction={sortField === 'session_time' ? sortDir : 'asc'}
                  onClick={() => handleSort('session_time')}
                >
                  {t(locale, 'time')}
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>
                {t(locale, 'sessionNotes')}
              </TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', width: 80 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((session) => (
              <TableRow
                key={session.id}
                hover
                sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                onClick={() => {
                  setEditingSession(session);
                  setDrawerOpen(true);
                }}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {(session as SessionWithClient).client?.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{formatDate(session.session_date)}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{formatTime(session.session_time)}</Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 360 }}>
                  {session.notes ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.6,
                      }}
                    >
                      {session.notes}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                      No notes
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title={t(locale, 'edit')}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSession(session);
                          setDrawerOpen(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t(locale, 'delete')}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDelete(session.id);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {paginated.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
                  {t(locale, 'noSessions')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filtered.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 25, 50]}
        sx={{ borderTop: 1, borderColor: 'divider', flexShrink: 0 }}
      />

      <SessionDrawer
        key={editingSession?.id ?? 'new'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        session={editingSession}
        clients={clients}
      />
    </Box>
  );
}
