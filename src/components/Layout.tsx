import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TableRowsIcon from '@mui/icons-material/TableRows';
import PeopleIcon from '@mui/icons-material/People';
import MenuIcon from '@mui/icons-material/Menu';
import SpaIcon from '@mui/icons-material/Spa';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LanguageIcon from '@mui/icons-material/Language';
import { useAppContext } from '../lib/AppContext';
import type { Locale } from '../lib/i18n';
import { t } from '../lib/i18n';

const DRAWER_WIDTH = 220;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface LayoutProps {
  children: React.ReactNode;
}

const LOCALES = [
  { code: 'en', name: 'English' },
  { code: 'pt', name: 'Português' },
];

export default function Layout({ children }: LayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, setMode, locale, setLocale } = useAppContext();

  const navItems: NavItem[] = [
    { label: t(locale, 'calendar'), path: '/', icon: <CalendarMonthIcon /> },
    {
      label: t(locale, 'sessions'),
      path: '/sessions',
      icon: <TableRowsIcon />,
    },
    { label: t(locale, 'clients'), path: '/clients', icon: <PeopleIcon /> },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleThemeToggle = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  const handleLanguageOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLangAnchor(event.currentTarget);
  };

  const handleLanguageSelect = (code: string) => {
    setLocale(code as Locale);
    setLangAnchor(null);
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <SpaIcon sx={{ color: 'primary.main', fontSize: 28 }} />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            letterSpacing: '-0.3px',
          }}
        >
          {t(locale, 'sessions')}
        </Typography>
      </Box>
      <Divider />
      <List sx={{ px: 1, pt: 1, flexGrow: 1 }}>
        {navItems.map((item) => {
          const selected = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={selected}
                onClick={() => handleNavClick(item.path)}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: selected ? 'inherit' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: selected ? 600 : 400,
                    fontSize: '0.9rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ px: 1, py: 2, display: 'flex', gap: 1 }}>
        <IconButton size="small" onClick={handleThemeToggle} title="Toggle theme">
          {mode === 'light' ? (
            <Brightness4Icon fontSize="small" />
          ) : (
            <Brightness7Icon fontSize="small" />
          )}
        </IconButton>
        <IconButton size="small" onClick={handleLanguageOpen} title="Select language">
          <LanguageIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {isMobile ? (
        <>
          <AppBar
            position="fixed"
            elevation={0}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              color: 'text.primary',
            }}
          >
            <Toolbar>
              <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
              <SpaIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, letterSpacing: '-0.3px', flexGrow: 1 }}
              >
                {t(locale, 'sessions')}
              </Typography>
              <IconButton size="small" onClick={handleThemeToggle}>
                {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
              </IconButton>
              <IconButton size="small" onClick={handleLanguageOpen}>
                <LanguageIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
          >
            {drawerContent}
          </Drawer>
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              pt: 8,
              minHeight: '100vh',
              bgcolor: 'background.default',
            }}
          >
            {children}
          </Box>
        </>
      ) : (
        <>
          <Drawer
            variant="permanent"
            sx={{
              width: DRAWER_WIDTH,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                boxSizing: 'border-box',
                border: 'none',
                borderRight: 1,
                borderColor: 'divider',
              },
            }}
          >
            {drawerContent}
          </Drawer>
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              minHeight: '100vh',
              bgcolor: 'background.default',
              overflow: 'hidden',
            }}
          >
            {children}
          </Box>
        </>
      )}

      <Menu
        anchorEl={langAnchor}
        open={Boolean(langAnchor)}
        onClose={() => setLangAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {LOCALES.map((loc) => (
          <MenuItem
            key={loc.code}
            selected={locale === loc.code}
            onClick={() => handleLanguageSelect(loc.code)}
          >
            {loc.name}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
