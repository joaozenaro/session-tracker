import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import { formatTime12 } from '../../lib/calendarUtils';
import type { SessionWithClient } from '../../lib/types';
import { t } from '../../lib/i18n';
import { useAppContext } from '../../lib/AppContext';

interface DayViewProps {
  sessions: SessionWithClient[];
  onSessionClick: (session: SessionWithClient) => void;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function DayView({ sessions, onSessionClick }: DayViewProps) {
  const { locale } = useAppContext();
  const sorted = [...sessions].sort((a, b) => a.session_time.localeCompare(b.session_time));

  if (sorted.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'text.disabled',
          gap: 1,
        }}
      >
        <Typography variant="body1">{t(locale, 'noSessionsThisDay')}</Typography>
        <Typography variant="caption">{t(locale, 'addSessionToSchedule')}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 3, py: 2, maxWidth: 640, mx: 'auto', width: '100%' }}>
      {sorted.map((session, index) => (
        <Box key={session.id}>
          {index > 0 && <Divider sx={{ my: 0 }} />}
          <Paper
            elevation={0}
            onClick={() => onSessionClick(session)}
            sx={{
              p: 2.5,
              cursor: 'pointer',
              borderRadius: 0,
              '&:hover': { bgcolor: 'action.hover' },
              display: 'flex',
              gap: 2,
              alignItems: 'flex-start',
            }}
          >
            <Box sx={{ minWidth: 60, pt: 0.25 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {formatTime12(session.session_time)}
              </Typography>
            </Box>
            <Avatar
              sx={{
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                width: 36,
                height: 36,
                fontSize: '0.8rem',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {getInitials(session.client?.name ?? '')}
            </Avatar>
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {session.client?.name}
              </Typography>
              {session.notes ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 0.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.65,
                  }}
                >
                  {session.notes}
                </Typography>
              ) : (
                <Typography
                  variant="body2"
                  color="text.disabled"
                  sx={{ mt: 0.5, fontStyle: 'italic' }}
                >
                  {t(locale, 'noNotesYet')}
                </Typography>
              )}
            </Box>
          </Paper>
        </Box>
      ))}
    </Box>
  );
}
