import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Drawer, Toolbar } from '@mui/material';
import { useI18n } from '../../contexts/I18nContext';
import { tokens } from '../../theme';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { dir } = useI18n();
  const isRtl = dir === 'rtl';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Topbar onMenuClick={() => setMobileOpen(true)} />

      {/* Below lg: collapsible drawer. At lg and up: permanent rail. */}
      <Drawer
        variant="temporary"
        anchor={isRtl ? 'right' : 'left'}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            width: tokens.sidebarWidth,
            boxSizing: 'border-box',
            border: 0,
          },
        }}
      >
        <Toolbar sx={{ minHeight: `${tokens.topbarHeight}px !important`, bgcolor: tokens.ink }} />
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </Drawer>

      <Drawer
        variant="permanent"
        anchor={isRtl ? 'right' : 'left'}
        open
        sx={{
          display: { xs: 'none', lg: 'block' },
          width: tokens.sidebarWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: tokens.sidebarWidth,
            boxSizing: 'border-box',
            border: 0,
            borderLeft: isRtl ? `1px solid ${tokens.line}` : 0,
            borderRight: isRtl ? 0 : `1px solid ${tokens.line}`,
          },
        }}
      >
        <Toolbar sx={{ minHeight: `${tokens.topbarHeight}px !important` }} />
        <Sidebar />
      </Drawer>

      <Box component="main" sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Toolbar sx={{ minHeight: `${tokens.topbarHeight}px !important` }} />
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, width: '100%', mx: 'auto' }}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </Box>
      </Box>
    </Box>
  );
}
