import { useMemo } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { AppRoutes } from './routes/AppRoutes';
import { createAppTheme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { I18nProvider, useI18n } from './contexts/I18nContext';

function ThemedApp() {
  const { dir } = useI18n();
  const theme = useMemo(() => createAppTheme(dir), [dir]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <ThemedApp />
      </AuthProvider>
    </I18nProvider>
  );
}
