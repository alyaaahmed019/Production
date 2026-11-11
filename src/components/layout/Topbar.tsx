import { useState, type FormEvent } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  ListItemIcon,
  Menu,
  MenuItem,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { Bell, Menu as MenuIcon, Search, Globe, LogOut } from 'lucide-react';
import logoImg from '../../assets/logo.jpg';
import { brand } from '../../config/brand';
import { tokens } from '../../theme';
import { useAuth, ROLE_LABELS } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, locale, toggleLocale } = useI18n();

  const [query, setQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/production/orders?q=${encodeURIComponent(trimmed)}` : '/production/orders');
  };

  const roleLabel = user ? ROLE_LABELS[user.role] : null;

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        zIndex: (theme: Theme) => theme.zIndex.drawer + 1,
        bgcolor: tokens.surface,
        borderBottom: `1px solid ${tokens.line}`,
      }}
    >
      <Toolbar sx={{ minHeight: `${tokens.topbarHeight}px !important`, gap: 1.5, px: { xs: 1.5, md: 2 } }}>
        <Tooltip title="Open navigation">
          <IconButton
            onClick={onMenuClick}
            edge="start"
            aria-label="Open navigation"
            sx={{ display: { lg: 'none' } }}
          >
            <MenuIcon size={20} />
          </IconButton>
        </Tooltip>

        {/* Logo */}
        <Box
          component={RouterLink}
          to="/production/orders"
          sx={{
            display: 'flex', alignItems: 'center', gap: 1.25,
            textDecoration: 'none', color: 'text.primary',
            width: { lg: tokens.sidebarWidth - 16 },
          }}
        >
          <Box
            component="img"
            src={logoImg}
            alt="LoomWorks Logo"
            sx={{
              height: 34,
              width: 'auto',
              maxHeight: 36,
              objectFit: 'contain',
              borderRadius: '4px',
            }}
          />
          <Box sx={{ lineHeight: 1.15 }}>
            <Typography variant="subtitle1" sx={{ lineHeight: 1.15 }}>
              {brand.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {brand.tagline}
            </Typography>
          </Box>
        </Box>

        {/* Search */}
        <Box
          component="form"
          role="search"
          onSubmit={handleSearch}
          sx={{ flex: 1, maxWidth: 440, display: { xs: 'none', sm: 'block' } }}
        >
          <TextField
            size="small" fullWidth
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`${t('search')} PO, ${t('client')}...`}
            inputProps={{ 'aria-label': 'Search orders' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} aria-hidden />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* Language toggle */}
        <Tooltip title={t('language')}>
          <Button
            onClick={toggleLocale}
            startIcon={<Globe size={14} />}
            size="small"
            variant="outlined"
            sx={{
              color: 'text.secondary', borderColor: tokens.line,
              fontSize: 11, fontWeight: 600, px: 1.2, py: 0.4,
              display: { xs: 'none', md: 'inline-flex' },
              '&:hover': { borderColor: tokens.stitch, color: tokens.stitch },
            }}
          >
            {t('language')}
          </Button>
        </Tooltip>

        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton aria-label="Notifications">
            <Badge color="error" variant="dot">
              <Bell size={20} />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* User avatar + dropdown */}
        {user && (
          <>
            <Tooltip title={locale === 'ar' ? user.displayNameAr : user.displayName}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1.25, pl: 1, cursor: 'pointer' }}
                onClick={(e) => setAnchorEl(e.currentTarget)}
              >
                <Avatar
                  sx={{
                    width: 32, height: 32, fontSize: '0.8125rem',
                    bgcolor: roleLabel?.color ?? tokens.ink,
                    cursor: 'pointer',
                  }}
                >
                  {user.avatarInitials}
                </Avatar>
                <Box sx={{ display: { xs: 'none', md: 'block' }, lineHeight: 1.2 }}>
                  <Typography variant="subtitle2" sx={{ lineHeight: 1.2 }}>
                    {locale === 'ar' ? user.displayNameAr : user.displayName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {roleLabel ? (locale === 'ar' ? roleLabel.ar : roleLabel.en) : ''}
                  </Typography>
                </Box>
              </Box>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              transformOrigin={{ horizontal: locale === 'ar' ? 'left' : 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: locale === 'ar' ? 'left' : 'right', vertical: 'bottom' }}
              PaperProps={{ sx: { mt: 1, minWidth: 200 } }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2">
                  {locale === 'ar' ? user.displayNameAr : user.displayName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {roleLabel ? (locale === 'ar' ? roleLabel.ar : roleLabel.en) : ''}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={toggleLocale}>
                <ListItemIcon><Globe size={16} /></ListItemIcon>
                {t('language')}
              </MenuItem>
              <MenuItem
                onClick={() => { setAnchorEl(null); logout(); navigate('/login'); }}
                sx={{ color: 'error.main' }}
              >
                <ListItemIcon sx={{ color: 'error.main' }}><LogOut size={16} /></ListItemIcon>
                {t('logout')}
              </MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
