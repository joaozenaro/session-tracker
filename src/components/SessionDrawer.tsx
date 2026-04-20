import { useState, useMemo } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Collapse from '@mui/material/Collapse';
import Autocomplete from '@mui/material/Autocomplete';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import { useAppContext } from '../lib/AppContext';
import RichTextEditor from './RichTextEditor';
import { t } from '../lib/i18n';
import type { Client, Session, SessionInsert } from '../lib/types';
import {
  useCreateSession,
  useUpdateSession,
  useCreateSessionSeries,
  useExtendSessionSeries,
  useSessionsByClient,
} from '../hooks/useSessions';

interface SessionDrawerProps {
  open: boolean;
  onClose: () => void;
  initialDate?: string;
  session?: Session | null;
  clients: Client[];
}

function formatDate(dateStr: string, locale: string = 'en-US') {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  const parts = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).formatToParts(date);

  return parts
    .map((part) => {
      if (part.type === 'weekday' || part.type === 'month') {
        part.value = part.value.charAt(0).toUpperCase() + part.value.slice(1);
      }
      return part.value;
    })
    .join('');
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

export default function SessionDrawer({
  open,
  onClose,
  initialDate,
  session,
  clients,
}: SessionDrawerProps) {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const { locale } = useAppContext();

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [date, setDate] = useState(session?.session_date ?? initialDate ?? today);
  const [time, setTime] = useState(session ? session.session_time.slice(0, 5) : '10:00');
  const [clientId, setClientId] = useState(session?.client_id ?? '');
  const [notes, setNotes] = useState(session?.notes ?? '');
  const [expandedPrev, setExpandedPrev] = useState<string | null>(null);

  const [showSeriesOptions, setShowSeriesOptions] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [numSessions, setNumSessions] = useState(4);

  const isEditing = !!session;

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const createSessionSeries = useCreateSessionSeries();
  const extendSessionSeries = useExtendSessionSeries();

  const saving =
    createSession.isPending ||
    updateSession.isPending ||
    createSessionSeries.isPending ||
    extendSessionSeries.isPending;

  // ── Previous sessions query ─────────────────────────────────────────────────
  // Only enabled when a client and date are selected and drawer is open.
  const {
    data: prevSessions = [],
    isLoading: loadingPrev,
    isLastInSeries,
  } = useSessionsByClient(open ? clientId : '', date, session?.id);

  // ── Save handler ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!clientId || !date || !time) return;

    try {
      if (showSeriesOptions && !isEditing) {
        // Create series + bulk sessions in one Rust command
        await createSessionSeries.mutateAsync({
          client_id: clientId,
          recurrence_type: recurrenceType,
          start_date: date,
          start_time: time,
          num_sessions: numSessions,
          notes,
        });
      } else {
        const payload: SessionInsert = {
          client_id: clientId,
          session_date: date,
          session_time: time,
          notes,
          series_id: session?.series_id ?? null,
        };

        if (isEditing) {
          await updateSession.mutateAsync({ id: session.id, payload });

          // If extend series was toggled during edit, also trigger extension
          if (showSeriesOptions && session.series_id) {
            await extendSessionSeries.mutateAsync({
              series_id: session.series_id,
              from_date: date,
              recurrence_type: recurrenceType,
              num_sessions: numSessions,
              session_time: time,
            });
          }
        } else {
          await createSession.mutateAsync(payload);
        }
      }

      onClose();
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const drawerWidth = isSmall ? '100vw' : 520;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: drawerWidth,
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
          {isEditing ? t(locale, 'editSession') : t(locale, 'newSession')}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box
        sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}
      >
        <Box sx={{ px: 2.5, pt: 2.5, pb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Autocomplete
            options={clients}
            getOptionLabel={(option) => option.name}
            value={clients.find((c) => c.id === clientId) || null}
            onChange={(_, newValue) => setClientId(newValue?.id || '')}
            renderInput={(params) => (
              <TextField {...params} label={t(locale, 'client')} size="small" />
            )}
            fullWidth
            size="small"
          />

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              label={t(locale, 'date')}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              fullWidth
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label={t(locale, 'time')}
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              fullWidth
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        </Box>

        <Divider />

        <Box
          sx={{ px: 2.5, pt: 2, pb: 1.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}
        >
          <Typography variant="overline" sx={{ color: 'text.secondary', mb: 1, letterSpacing: 1 }}>
            {t(locale, 'sessionNotes')}
          </Typography>
          <RichTextEditor
            value={notes}
            onChange={setNotes}
            placeholder={t(locale, 'sessionNotesPlaceholder')}
          />
        </Box>

        {!isEditing && (
          <>
            <Divider sx={{ mx: 2.5 }} />
            <Box sx={{ px: 2.5, pt: 1.5, pb: 1 }}>
              <Button
                fullWidth
                startIcon={<EventRepeatIcon />}
                onClick={() => setShowSeriesOptions(!showSeriesOptions)}
                sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
              >
                {t(locale, 'createRecurringSessions')}
              </Button>
              <Collapse in={showSeriesOptions}>
                <Box sx={{ pt: 0.5, pb: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', display: 'block', mb: 1 }}
                    >
                      {t(locale, 'recurrence')}
                    </Typography>
                    <RadioGroup
                      value={recurrenceType}
                      onChange={(e) =>
                        setRecurrenceType(e.target.value as 'weekly' | 'biweekly' | 'monthly')
                      }
                      row
                      sx={{ gap: 2 }}
                    >
                      <FormControlLabel
                        value="weekly"
                        control={<Radio size="small" />}
                        label={t(locale, 'weekly')}
                      />
                      <FormControlLabel
                        value="biweekly"
                        control={<Radio size="small" />}
                        label={t(locale, 'biweekly')}
                      />
                      <FormControlLabel
                        value="monthly"
                        control={<Radio size="small" />}
                        label={t(locale, 'monthly')}
                      />
                    </RadioGroup>
                  </Box>
                  <TextField
                    label={t(locale, 'numberOfSessions')}
                    type="number"
                    value={numSessions}
                    onChange={(e) => setNumSessions(Math.max(1, parseInt(e.target.value) || 1))}
                    size="small"
                    slotProps={{ htmlInput: { min: 1, max: 52 } }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {t(locale, 'willCreate').replace('{count}', numSessions.toString())}
                  </Typography>
                </Box>
              </Collapse>
            </Box>
          </>
        )}

        {isEditing && session?.series_id && isLastInSeries && (
          <>
            <Divider sx={{ mx: 2.5 }} />
            <Box sx={{ px: 2.5, pt: 1.5, pb: 1.5 }}>
              <Button
                fullWidth
                startIcon={<EventRepeatIcon />}
                onClick={() => setShowSeriesOptions(!showSeriesOptions)}
                sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
              >
                {t(locale, 'extendSeries')}
              </Button>
              <Collapse in={showSeriesOptions}>
                <Box sx={{ pt: 0.5, pb: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', display: 'block', mb: 1 }}
                    >
                      {t(locale, 'recurrence')}
                    </Typography>
                    <RadioGroup
                      value={recurrenceType}
                      onChange={(e) =>
                        setRecurrenceType(e.target.value as 'weekly' | 'biweekly' | 'monthly')
                      }
                      row
                      sx={{ gap: 2 }}
                    >
                      <FormControlLabel
                        value="weekly"
                        control={<Radio size="small" />}
                        label={t(locale, 'weekly')}
                      />
                      <FormControlLabel
                        value="biweekly"
                        control={<Radio size="small" />}
                        label={t(locale, 'biweekly')}
                      />
                      <FormControlLabel
                        value="monthly"
                        control={<Radio size="small" />}
                        label={t(locale, 'monthly')}
                      />
                    </RadioGroup>
                  </Box>
                  <TextField
                    label={t(locale, 'numberOfSessionsToAdd')}
                    type="number"
                    value={numSessions}
                    onChange={(e) => setNumSessions(Math.max(1, parseInt(e.target.value) || 1))}
                    size="small"
                    inputProps={{ min: 1, max: 52 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {t(locale, 'willAdd').replace('{count}', numSessions.toString())}
                  </Typography>
                </Box>
              </Collapse>
            </Box>
          </>
        )}

        {clientId && (
          <>
            <Divider sx={{ mx: 2.5 }} />
            <Box sx={{ px: 2.5, pt: 2, pb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <HistoryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 1 }}>
                  {t(locale, 'previousSessions')}
                </Typography>
                {loadingPrev && <CircularProgress size={12} />}
              </Box>

              {!loadingPrev && prevSessions.length === 0 && (
                <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                  {t(locale, 'noPreviousSessions')}
                </Typography>
              )}

              {prevSessions.map((prev) => (
                <Paper
                  key={prev.id}
                  variant="outlined"
                  sx={{ mb: 1, borderRadius: 1.5, overflow: 'hidden' }}
                >
                  <Box
                    sx={{
                      px: 2,
                      py: 1.25,
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => setExpandedPrev(expandedPrev === prev.id ? null : prev.id)}
                  >
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatDate(prev.session_date, locale)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(prev.session_time)}
                      </Typography>
                    </Box>
                    <Chip
                      label={prev.notes ? `${prev.notes.split(' ').length} words` : 'No notes'}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1, fontSize: '0.7rem' }}
                    />
                    {expandedPrev === prev.id ? (
                      <ExpandLessIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    ) : (
                      <ExpandMoreIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    )}
                  </Box>
                  {expandedPrev === prev.id && (
                    <Box
                      sx={{
                        px: 2,
                        pb: 2,
                        pt: 0.5,
                        borderTop: 1,
                        borderColor: 'divider',
                        bgcolor: 'background.default',
                      }}
                    >
                      {prev.notes ? (
                        <Typography
                          component="div"
                          variant="body2"
                          sx={{ lineHeight: 1.75, color: 'text.secondary' }}
                          dangerouslySetInnerHTML={{ __html: prev.notes }}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          color="text.disabled"
                          sx={{ fontStyle: 'italic' }}
                        >
                          {t(locale, 'noNotesForThisSession')}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Paper>
              ))}
            </Box>
          </>
        )}
      </Box>

      <Box sx={{ px: 2.5, py: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1.5 }}>
        <Button variant="outlined" onClick={onClose} fullWidth disabled={saving}>
          {t(locale, 'cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSave()}
          fullWidth
          disabled={saving || !clientId || !date || !time}
          disableElevation
        >
          {saving ? (
            <CircularProgress size={20} color="inherit" />
          ) : isEditing ? (
            t(locale, 'saveChanges')
          ) : (
            t(locale, 'addSession')
          )}
        </Button>
      </Box>
    </Drawer>
  );
}
