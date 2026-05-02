import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import MicIcon from '@mui/icons-material/Mic';
import { useAppContext } from '../lib/AppContext';
import { t } from '../lib/i18n';
import type { Locale } from '../lib/i18n';

interface MicDevice {
  id: string;
  name: string;
}

interface SettingsPanelProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

const LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'pt', label: 'PT' },
];

export default function SettingsPanel({ anchorEl, onClose }: SettingsPanelProps) {
  const { mode, setMode, locale, setLocale, micDeviceId, setMicDeviceId } = useAppContext();

  const [devices, setDevices] = useState<MicDevice[]>([]);

  const open = Boolean(anchorEl);
  // Derive loading: popover is open but device list hasn't arrived yet.
  // No synchronous setState inside effects — loading is fully derived.
  const loadingDevices = open && devices.length === 0;

  // Fetch the device list whenever the popover opens; cancel & reset on close.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    invoke<MicDevice[]>('list_microphones')
      .then((list) => {
        if (!cancelled) setDevices(list);
      })
      .catch((err) => console.error('[settings] list_microphones error:', err));
    return () => {
      cancelled = true;
      setDevices([]);
    };
  }, [open]);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      slotProps={{
        paper: {
          sx: {
            width: 280,
            borderRadius: 2,
            boxShadow: 8,
            overflow: 'hidden',
          },
        },
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2.5, py: 1.5, bgcolor: 'background.default' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
          {t(locale, 'settings')}
        </Typography>
      </Box>

      <Divider />

      <Box sx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* ── Appearance ─────────────────────────────────────────────────── */}
        <Box>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              display: 'block',
              mb: 1,
            }}
          >
            {t(locale, 'appearance')}
          </Typography>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, val) => val && setMode(val as 'light' | 'dark')}
            size="small"
            fullWidth
          >
            <ToggleButton value="light" aria-label="light mode" sx={{ gap: 0.75, py: 0.75 }}>
              <LightModeIcon fontSize="small" />
              <Typography variant="caption" sx={{ textTransform: 'none', fontWeight: 500 }}>
                Light
              </Typography>
            </ToggleButton>
            <ToggleButton value="dark" aria-label="dark mode" sx={{ gap: 0.75, py: 0.75 }}>
              <DarkModeIcon fontSize="small" />
              <Typography variant="caption" sx={{ textTransform: 'none', fontWeight: 500 }}>
                Dark
              </Typography>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* ── Language ───────────────────────────────────────────────────── */}
        <Box>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              display: 'block',
              mb: 1,
            }}
          >
            {t(locale, 'language')}
          </Typography>
          <ToggleButtonGroup
            value={locale}
            exclusive
            onChange={(_, val) => val && setLocale(val as Locale)}
            size="small"
            fullWidth
          >
            {LOCALES.map(({ code, label }) => (
              <ToggleButton key={code} value={code} sx={{ py: 0.75 }}>
                <Typography variant="caption" sx={{ textTransform: 'none', fontWeight: 500 }}>
                  {label}
                </Typography>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {/* ── Microphone ─────────────────────────────────────────────────── */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
            <MicIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}
            >
              {t(locale, 'microphone')}
            </Typography>
          </Box>
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ display: 'block', mb: 1, lineHeight: 1.4 }}
          >
            {t(locale, 'microphoneHint')}
          </Typography>
          {loadingDevices ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
              <CircularProgress size={18} />
            </Box>
          ) : (
            <FormControl fullWidth size="small">
              <Select
                value={micDeviceId ?? ''}
                onChange={(e) => setMicDeviceId(e.target.value || null)}
                displayEmpty
                renderValue={(val) => {
                  if (!val) return t(locale, 'systemDefault');
                  return devices.find((d) => d.id === val)?.name ?? val;
                }}
              >
                <MenuItem value="">
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    {t(locale, 'systemDefault')}
                  </Typography>
                </MenuItem>
                {devices.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    <Typography variant="body2">{d.name}</Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </Box>
    </Popover>
  );
}
