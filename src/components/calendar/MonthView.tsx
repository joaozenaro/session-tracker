import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import { useAppContext } from '../../lib/AppContext';
import { t } from '../../lib/i18n';
import { getCalendarGrid, toLocalDateString, formatTime12 } from '../../lib/calendarUtils';
import type { SessionWithClient } from '../../lib/types';

interface MonthViewProps {
  year: number;
  month: number;
  sessions: SessionWithClient[];
  today: string;
  onDayClick: (dateStr: string) => void;
  onSessionClick: (session: SessionWithClient) => void;
}

export default function MonthView({
  year,
  month,
  sessions,
  today,
  onDayClick,
  onSessionClick,
}: MonthViewProps) {
  const { locale } = useAppContext();

  // Day labels (abbreviated versions)
  const DAY_LABELS = [
    t(locale, 'monday'),
    t(locale, 'tuesday'),
    t(locale, 'wednesday'),
    t(locale, 'thursday'),
    t(locale, 'friday'),
    t(locale, 'saturday'),
    t(locale, 'sunday'),
  ].map((label) => label.slice(0, 3));

  const grid = getCalendarGrid(year, month);

  const sessionsByDate: Record<string, SessionWithClient[]> = {};
  sessions.forEach((s) => {
    if (!sessionsByDate[s.session_date]) sessionsByDate[s.session_date] = [];
    sessionsByDate[s.session_date].push(s);
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        {DAY_LABELS.map((label) => (
          <Box key={label} sx={{ py: 1, textAlign: 'center' }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {label}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridTemplateRows: `repeat(${grid.length / 7}, 1fr)`,
          flexGrow: 1,
          '& > *': { borderRight: 1, borderBottom: 1, borderColor: 'divider' },
        }}
      >
        {grid.map((day, i) => {
          if (!day) return <Box key={`empty-${i}`} sx={{ bgcolor: 'action.hover' }} />;
          const dateStr = toLocalDateString(day);
          const daySessions = (sessionsByDate[dateStr] ?? []).sort((a, b) =>
            a.session_time.localeCompare(b.session_time)
          );
          const isToday = dateStr === today;
          const isCurrentMonth = day.getMonth() === month;

          return (
            <Box
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              sx={{
                p: 0.75,
                cursor: 'pointer',
                minHeight: 90,
                '&:hover': { bgcolor: 'action.hover' },
                opacity: isCurrentMonth ? 1 : 0.4,
              }}
            >
              <Box
                sx={{
                  width: 26,
                  height: 26,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  mb: 0.5,
                  bgcolor: isToday ? 'primary.main' : 'transparent',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: isToday ? 700 : 400,
                    color: isToday ? 'primary.contrastText' : 'text.primary',
                    fontSize: '0.78rem',
                  }}
                >
                  {day.getDate()}
                </Typography>
              </Box>

              {daySessions.slice(0, 3).map((s) => (
                <Paper
                  key={s.id}
                  elevation={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSessionClick(s);
                  }}
                  sx={{
                    px: 0.75,
                    py: 0.25,
                    mb: 0.25,
                    bgcolor: s.client?.color || 'primary.main',
                    borderRadius: 0.75,
                    cursor: 'pointer',
                    '&:hover': { filter: 'brightness(0.95)' },
                    overflow: 'hidden',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.primary',
                      fontSize: '0.68rem',
                      display: 'block',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontWeight: 500,
                    }}
                  >
                    {formatTime12(s.session_time)} {s.client?.name.split(' ')[0]}
                  </Typography>
                </Paper>
              ))}

              {daySessions.length > 3 && (
                <Chip
                  label={`+${daySessions.length - 3} more`}
                  size="small"
                  sx={{ fontSize: '0.65rem', height: 16, borderRadius: 0.75 }}
                />
              )}
            </Box>
          );
        })}
      </Box>

      <Box
        sx={{
          height: 0,
          '& > *:last-child': { borderRight: 'none' },
        }}
      />
    </Box>
  );
}
