import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { toLocalDateString, formatTime12 } from '../../lib/calendarUtils';
import type { SessionWithClient } from '../../lib/types';

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface WeekViewProps {
  weekStart: Date;
  sessions: SessionWithClient[];
  today: string;
  onDayClick: (dateStr: string) => void;
  onSessionClick: (session: SessionWithClient) => void;
}

export default function WeekView({
  weekStart,
  sessions,
  today,
  onDayClick,
  onSessionClick,
}: WeekViewProps) {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

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
        {days.map((day, i) => {
          const dateStr = toLocalDateString(day);
          const isToday = dateStr === today;
          return (
            <Box
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              sx={{
                py: 1.5,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
                borderRight: i < 6 ? 1 : 0,
                borderColor: 'divider',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  display: 'block',
                }}
              >
                {DAY_SHORT[i]}
              </Typography>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: isToday ? 'primary.main' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mt: 0.5,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? 'primary.contrastText' : 'text.primary',
                    fontSize: '0.9rem',
                  }}
                >
                  {day.getDate()}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          flexGrow: 1,
          alignContent: 'start',
          overflowY: 'auto',
          '& > *:not(:last-child)': { borderRight: 1, borderColor: 'divider' },
        }}
      >
        {days.map((day) => {
          const dateStr = toLocalDateString(day);
          const daySessions = (sessionsByDate[dateStr] ?? []).sort((a, b) =>
            a.session_time.localeCompare(b.session_time)
          );
          return (
            <Box
              key={dateStr}
              sx={{
                p: 0.75,
                minHeight: 120,
                '&:hover': { bgcolor: 'action.hover' },
                cursor: 'pointer',
              }}
              onClick={() => onDayClick(dateStr)}
            >
              {daySessions.map((s) => (
                <Paper
                  key={s.id}
                  elevation={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSessionClick(s);
                  }}
                  sx={{
                    p: 1,
                    mb: 0.75,
                    bgcolor: 'primary.main',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'primary.contrastText',
                      fontWeight: 600,
                      display: 'block',
                      fontSize: '0.72rem',
                    }}
                  >
                    {formatTime12(s.session_time)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'primary.contrastText',
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                    }}
                  >
                    {s.client?.name.split(' ')[0]}
                  </Typography>
                  {s.notes && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'rgba(255,255,255,0.75)',
                        display: 'block',
                        fontSize: '0.68rem',
                        mt: 0.25,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s.notes.slice(0, 60)}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
