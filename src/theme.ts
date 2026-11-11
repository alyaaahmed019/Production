import { createTheme } from '@mui/material/styles';

export const tokens = {
  ink: '#1B2A41',
  inkRaised: '#243650',
  canvas: '#F2F4F7',
  surface: '#FFFFFF',
  line: '#DCE1E8',
  lineSoft: '#E8ECF1',
  textPrimary: '#18212F',
  textSecondary: '#586377',
  textMuted: '#8993A4',
  /** Amber "thread" accent — used for stitch lines and the active nav marker. */
  stitch: '#D9962B',
  sidebarWidth: 248,
  topbarHeight: 60,
} as const;

export function createAppTheme(direction: 'ltr' | 'rtl' = 'ltr') {
  return createTheme({
    direction,
    palette: {
      primary: { main: tokens.ink, dark: '#111C2D', light: tokens.inkRaised, contrastText: '#FFFFFF' },
      secondary: { main: tokens.stitch },
      background: { default: tokens.canvas, paper: tokens.surface },
      text: { primary: tokens.textPrimary, secondary: tokens.textSecondary },
      divider: tokens.line,
      error: { main: '#C2331F' },
      success: { main: '#157A3C' },
    },
    shape: { borderRadius: 6 },
    typography: {
      fontFamily:
        direction === 'rtl'
          ? '"IBM Plex Sans Arabic", "Segoe UI", system-ui, -apple-system, Roboto, sans-serif'
          : '"IBM Plex Sans", "Segoe UI", system-ui, -apple-system, Roboto, sans-serif',
      fontSize: 14,
      h4: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: direction === 'rtl' ? 0 : '-0.01em' },
      h5: { fontSize: '1.25rem', fontWeight: 600, letterSpacing: direction === 'rtl' ? 0 : '-0.005em' },
      h6: { fontSize: '1rem', fontWeight: 600 },
      subtitle1: { fontSize: '0.9375rem', fontWeight: 600 },
      subtitle2: { fontSize: '0.8125rem', fontWeight: 600 },
      body2: { fontSize: '0.8125rem' },
      caption: { fontSize: '0.75rem' },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { fontVariantNumeric: 'tabular-nums', backgroundColor: tokens.canvas },
          ':focus-visible': { outlineColor: tokens.stitch },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { borderRadius: 6 } },
      },
      MuiPaper: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: { root: { borderColor: tokens.line, backgroundImage: 'none' } },
      },
      MuiTooltip: { defaultProps: { arrow: true } },
      MuiTableCell: {
        styleOverrides: {
          root: { borderBottomColor: tokens.lineSoft, padding: '10px 16px', fontSize: '0.8125rem' },
          head: {
            backgroundColor: '#F7F8FA',
            color: tokens.textSecondary,
            fontWeight: 600,
            fontSize: '0.75rem',
            whiteSpace: 'nowrap',
            borderBottomColor: tokens.line,
          },
        },
      },
      MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    },
  });
}

export const theme = createAppTheme('ltr');
