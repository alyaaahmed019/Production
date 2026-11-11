import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Box, Collapse, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { navigation, type NavItem } from '../../config/navigation';
import { useI18n } from '../../contexts/I18nContext';
import { tokens } from '../../theme';

interface SidebarProps {
  onNavigate?: () => void;
}

const itemSx = (active: boolean, nested = false, isRtl = false) => ({
  position: 'relative' as const,
  mx: 1.25,
  my: 0.25,
  borderRadius: '6px',
  py: 0.9,
  pr: nested && isRtl ? 5 : 1.5,
  pl: nested && !isRtl ? 5 : 1.5,
  color: active ? '#FFFFFF' : 'rgba(255,255,255,0.72)',
  bgcolor: active ? tokens.inkRaised : 'transparent',
  '&:hover': { bgcolor: tokens.inkRaised, color: '#FFFFFF' },
  ...(active
    ? {
        '&::before': {
          content: '""',
          position: 'absolute' as const,
          [isRtl ? 'right' : 'left']: -10,
          top: 8,
          bottom: 8,
          width: 3,
          borderRadius: 2,
          bgcolor: tokens.stitch,
        },
      }
    : {}),
});

function NavLeaf({
  item,
  nested,
  onNavigate,
  isRtl,
  label,
}: {
  item: NavItem;
  nested?: boolean;
  onNavigate?: () => void;
  isRtl: boolean;
  label: string;
}) {
  const { pathname } = useLocation();
  const active = pathname === item.path || pathname.startsWith(`${item.path}/`);
  const Icon = item.icon;
  return (
    <ListItemButton
      component={NavLink}
      to={item.path}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      sx={itemSx(active, nested, isRtl)}
    >
      <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
        <Icon size={nested ? 16 : 18} aria-hidden />
      </ListItemIcon>
      <ListItemText
        primary={label}
        primaryTypographyProps={{ sx: { fontSize: '0.8125rem', fontWeight: active ? 600 : 500 } }}
      />
    </ListItemButton>
  );
}

function NavGroup({
  item,
  onNavigate,
  isRtl,
  label,
  locale,
}: {
  item: NavItem;
  onNavigate?: () => void;
  isRtl: boolean;
  label: string;
  locale: string;
}) {
  const { pathname } = useLocation();
  const containsActive = pathname.startsWith(item.path);
  const [open, setOpen] = useState(true);
  const Icon = item.icon;
  return (
    <>
      <ListItemButton
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        sx={{ ...itemSx(false, false, isRtl), color: containsActive ? '#FFFFFF' : 'rgba(255,255,255,0.72)' }}
      >
        <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
          <Icon size={18} aria-hidden />
        </ListItemIcon>
        <ListItemText
          primary={label}
          primaryTypographyProps={{ sx: { fontSize: '0.8125rem', fontWeight: 500 } }}
        />
        {open ? (
          <ChevronDown size={16} aria-hidden />
        ) : isRtl ? (
          <ChevronLeft size={16} aria-hidden />
        ) : (
          <ChevronRight size={16} aria-hidden />
        )}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List disablePadding>
          {item.children?.map((child) => (
            <NavLeaf
              key={child.path}
              item={child}
              nested
              onNavigate={onNavigate}
              isRtl={isRtl}
              label={locale === 'ar' ? child.labelAr || child.label : child.label}
            />
          ))}
        </List>
      </Collapse>
    </>
  );
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { locale, dir } = useI18n();
  const isRtl = dir === 'rtl';

  return (
    <Box
      component="nav"
      aria-label="Main navigation"
      sx={{ height: '100%', bgcolor: tokens.ink, py: 1.5, overflowY: 'auto' }}
    >
      <List disablePadding>
        {navigation.map((item) => {
          const label = locale === 'ar' ? item.labelAr || item.label : item.label;
          return item.children ? (
            <NavGroup
              key={item.path}
              item={item}
              onNavigate={onNavigate}
              isRtl={isRtl}
              label={label}
              locale={locale}
            />
          ) : (
            <NavLeaf
              key={item.path}
              item={item}
              onNavigate={onNavigate}
              isRtl={isRtl}
              label={label}
            />
          );
        })}
      </List>
    </Box>
  );
}
