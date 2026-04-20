import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import { useAppContext } from '../lib/AppContext';
import { t } from '../lib/i18n';
import type { Session, SessionWithClient } from '../types/session';
import SessionDrawer from '../components/SessionDrawer';
import MonthView from '../components/calendar/MonthView';
import WeekView from '../components/calendar/WeekView';
import DayView from '../components/calendar/DayView';
import {
  toLocalDateString,
  formatMonthYear,
  formatWeekRange,
  formatDayFull,
  startOfWeekMonday,
  parseLocalDate,
} from '../lib/calendarUtils';
import { useSessions } from '../hooks/useSessions';
import { useClients } from '../hooks/useClients';

type CalendarView = 'day' | 'week' | 'month';

export default function CalendarPage() {
  const todayDate = new Date();
  const todayStr = toLocalDateString(todayDate);
  const { locale } = useAppContext();

  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [drawerInitialDate, setDrawerInitialDate] = useState<string | undefined>(undefined);

  const { data: sessions = [], isLoading, error } = useSessions();
  const { data: clients = [] } = useClients();

  const handleViewChange = (_: React.MouseEvent<HTMLElement>, v: CalendarView | null) => {
    if (v) setView(v);
  };

  const navigatePrev = () => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() - 1);
    else if (view === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const navigateNext = () => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + 1);
    else if (view === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const navigateToday = () => setCurrentDate(new Date());

  const getTitle = () => {
    if (view === 'month') return formatMonthYear(currentDate, locale);
    if (view === 'week') return formatWeekRange(startOfWeekMonday(currentDate), locale);
    return formatDayFull(currentDate, locale);
  };

  const getVisibleSessions = (): SessionWithClient[] => {
    const all = sessions as SessionWithClient[];
    if (view === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      return all.filter((s) => {
        const d = parseLocalDate(s.session_date);
        return d.getFullYear() === year && d.getMonth() === month;
      });
    }
    if (view === 'week') {
      const weekStart = startOfWeekMonday(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return all.filter((s) => {
        const d = parseLocalDate(s.session_date);
        return d >= weekStart && d <= weekEnd;
      });
    }
    const dateStr = toLocalDateString(currentDate);
    return all.filter((s) => s.session_date === dateStr);
  };

  const handleDayClick = (dateStr: string) => {
    setEditingSession(null);
    setDrawerInitialDate(dateStr);
    setDrawerOpen(true);
  };

  const handleSessionClick = (session: SessionWithClient) => {
    setEditingSession(session);
    setDrawerInitialDate(session.session_date);
    setDrawerOpen(true);
  };

  const handleAddSession = () => {
    setEditingSession(null);
    if (view === 'day') {
      setDrawerInitialDate(toLocalDateString(currentDate));
    } else {
      setDrawerInitialDate(todayStr);
    }
    setDrawerOpen(true);
  };

  const visibleSessions = getVisibleSessions();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          flexShrink: 0,
        }}
      >
        <IconButton size="small" onClick={navigatePrev}>
          <ChevronLeftIcon />
        </IconButton>
        <IconButton size="small" onClick={navigateNext}>
          <ChevronRightIcon />
        </IconButton>
        <Button
          size="small"
          startIcon={<TodayIcon />}
          onClick={navigateToday}
          sx={{ mr: 1, textTransform: 'none' }}
        >
          {t(locale, 'today')}
        </Button>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, flexGrow: 1, fontSize: '1rem' }}>
          {getTitle()}
        </Typography>
        {isLoading && <CircularProgress size={16} sx={{ mr: 1 }} />}
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={handleViewChange}
          size="small"
          sx={{ mr: 1 }}
        >
          <ToggleButton
            value="day"
            sx={{ textTransform: 'none', px: 1.5, py: 0.5, fontSize: '0.8rem' }}
          >
            {t(locale, 'day')}
          </ToggleButton>
          <ToggleButton
            value="week"
            sx={{ textTransform: 'none', px: 1.5, py: 0.5, fontSize: '0.8rem' }}
          >
            {t(locale, 'week')}
          </ToggleButton>
          <ToggleButton
            value="month"
            sx={{ textTransform: 'none', px: 1.5, py: 0.5, fontSize: '0.8rem' }}
          >
            {t(locale, 'month')}
          </ToggleButton>
        </ToggleButtonGroup>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddSession}
          disableElevation
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

      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {view === 'month' && (
          <MonthView
            year={currentDate.getFullYear()}
            month={currentDate.getMonth()}
            sessions={visibleSessions}
            today={todayStr}
            onDayClick={handleDayClick}
            onSessionClick={handleSessionClick}
          />
        )}
        {view === 'week' && (
          <WeekView
            weekStart={startOfWeekMonday(currentDate)}
            sessions={visibleSessions}
            today={todayStr}
            onDayClick={handleDayClick}
            onSessionClick={handleSessionClick}
          />
        )}
        {view === 'day' && (
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <DayView sessions={visibleSessions} onSessionClick={handleSessionClick} />
          </Box>
        )}
      </Box>

      <SessionDrawer
        key={`${editingSession?.id ?? 'new'}-${drawerInitialDate}`}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initialDate={drawerInitialDate}
        session={editingSession}
        clients={clients}
      />
    </Box>
  );
}
