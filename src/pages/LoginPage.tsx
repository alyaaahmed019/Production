import { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import {
  Eye,
  EyeOff,
  Globe,
  Lock,
  User,
  Layers,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLE_LABELS } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';

const DEMO_USERS = [
  { username: 'po_manager', role: 'po_manager' as const },
  { username: 'planner', role: 'planner' as const },
  { username: 'cutting', role: 'cutting' as const },
  { username: 'sewing', role: 'sewing' as const },
  { username: 'ironing', role: 'ironing' as const },
  { username: 'packing', role: 'packing' as const },
];

// Production workflow stages shown on the left panel
const WORKFLOW_STEPS = [
  { key: 'marker', icon: '📐' },
  { key: 'cutting', icon: '✂️' },
  { key: 'sewing', icon: '🧵' },
  { key: 'ironing', icon: '🔥' },
  { key: 'packing', icon: '📦' },
  { key: 'shipping', icon: '🚢' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const { t, locale, toggleLocale, dir } = useI18n();
  const navigate = useNavigate();
  const isAr = locale === 'ar';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const result = login(username, password);
      setLoading(false);
      if (result.success) {
        navigate('/production/orders');
      } else {
        setError(t('invalidCredentials'));
      }
    }, 500);
  }

  function handleDemoLogin(uname: string) {
    const result = login(uname, '1234');
    if (result.success) navigate('/production/orders');
  }

  return (
    <Box
      dir={dir}
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: '#080f1a',
        fontFamily: isAr
          ? '"Cairo", "IBM Plex Sans Arabic", system-ui, sans-serif'
          : '"Inter", "IBM Plex Sans", system-ui, sans-serif',
      }}
    >
      {/* ════════════════════════════════════════
          LEFT PANEL  — hidden on mobile
      ════════════════════════════════════════ */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          width: '45%',
          maxWidth: 520,
          bgcolor: '#0d1a2e',
          borderRight: isAr ? 'none' : '1px solid #1e2d42',
          borderLeft: isAr ? '1px solid #1e2d42' : 'none',
          position: 'relative',
          overflow: 'hidden',
          p: 5,
        }}
      >
        {/* Decorative grid pattern */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),' +
              'linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
          }}
        />
        {/* Blue glow */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -100,
            left: isAr ? 'auto' : -100,
            right: isAr ? -100 : 'auto',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(29,78,216,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 6, position: 'relative' }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(59,130,246,0.4)',
            }}
          >
            <Layers size={22} color="#fff" />
          </Box>
          <Box>
            <Typography
              sx={{
                color: '#f1f5f9',
                fontWeight: 700,
                fontSize: 15,
                lineHeight: 1.1,
                letterSpacing: isAr ? 0 : -0.3,
              }}
            >
              {t('appName')}
            </Typography>
            <Typography sx={{ color: '#475569', fontSize: 11, letterSpacing: 0.3 }}>
              v1.0
            </Typography>
          </Box>
        </Box>

        {/* Headline */}
        <Box sx={{ position: 'relative', mb: 5 }}>
          <Typography
            sx={{
              fontSize: { md: 28, lg: 34 },
              fontWeight: 800,
              color: '#f1f5f9',
              lineHeight: 1.25,
              letterSpacing: isAr ? 0 : -0.8,
              mb: 2,
            }}
          >
            {isAr ? 'تحكّم كامل في\nرحلة الإنتاج' : 'Full control over\nyour production'}
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: 14, lineHeight: 1.7 }}>
            {isAr
              ? 'من استلام الأوردر حتى الشحن — تابع كل مرحلة بدقة'
              : 'From PO receipt to shipment — track every stage precisely'}
          </Typography>
        </Box>

        {/* Workflow steps */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, position: 'relative' }}>
          {WORKFLOW_STEPS.map((step, i) => (
            <Box
              key={step.key}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                py: 1,
                px: 1.5,
                borderRadius: 2,
                bgcolor: i === 1 ? 'rgba(29,78,216,0.12)' : 'transparent',
                border: i === 1 ? '1px solid rgba(29,78,216,0.25)' : '1px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  bgcolor: i === 1 ? 'rgba(29,78,216,0.2)' : 'rgba(255,255,255,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                  flexShrink: 0,
                }}
              >
                {step.icon}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    color: i === 1 ? '#93c5fd' : '#94a3b8',
                    fontSize: 13,
                    fontWeight: i === 1 ? 600 : 400,
                  }}
                >
                  {t(step.key as 'marker' | 'cutting' | 'sewing' | 'ironing' | 'packing' | 'shipping')}
                </Typography>
              </Box>
              {i === 1 && (
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: '#3b82f6',
                    boxShadow: '0 0 6px #3b82f6',
                  }}
                />
              )}
            </Box>
          ))}
        </Box>

        {/* Bottom tag */}
        <Box sx={{ mt: 'auto', pt: 4, position: 'relative' }}>
          <Typography sx={{ color: '#1e3a5f', fontSize: 11 }}>
            © 2026 Production Management System
          </Typography>
        </Box>
      </Box>

      {/* ════════════════════════════════════════
          RIGHT PANEL — login form
      ════════════════════════════════════════ */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
        }}
      >
        {/* Top bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 3, md: 5 },
            py: 2.5,
            borderBottom: '1px solid #1e2d42',
          }}
        >
          {/* Mobile logo */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={16} color="#fff" />
            </Box>
            <Typography sx={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13 }}>
              {t('appName')}
            </Typography>
          </Box>
          <Box sx={{ display: { xs: 'none', md: 'block' } }} />

          {/* Language toggle */}
          <Button
            onClick={toggleLocale}
            startIcon={<Globe size={14} />}
            size="small"
            sx={{
              color: '#94a3b8',
              border: '1px solid #1e2d42',
              borderRadius: 2,
              px: 1.5,
              py: 0.5,
              fontSize: 12,
              fontWeight: 600,
              gap: 0.5,
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.05)',
                borderColor: '#3b82f6',
                color: '#93c5fd',
              },
              transition: 'all 0.2s',
            }}
          >
            {t('language')}
          </Button>
        </Box>

        {/* Form area */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: { xs: 3, sm: 5, md: 6 },
            py: 5,
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 400 }}>
            {/* Heading */}
            <Box sx={{ mb: 5 }}>
              <Typography
                sx={{
                  fontSize: { xs: 24, sm: 28 },
                  fontWeight: 800,
                  color: '#f1f5f9',
                  letterSpacing: isAr ? 0 : -0.6,
                  mb: 1,
                }}
              >
                {t('welcomeBack')}
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: 14 }}>
                {t('loginSubtitle')}
              </Typography>
            </Box>

            {/* Error */}
            {error && (
              <Alert
                severity="error"
                onClose={() => setError('')}
                sx={{
                  mb: 3,
                  bgcolor: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#fca5a5',
                  borderRadius: 2,
                  fontSize: 13,
                  '.MuiAlert-icon': { color: '#f87171' },
                  '.MuiAlert-action .MuiIconButton-root': { color: '#f87171' },
                }}
              >
                {error}
              </Alert>
            )}

            {/* Form */}
            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
              sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
            >
              {/* Username */}
              <Box>
                <Typography
                  sx={{
                    color: '#94a3b8',
                    fontSize: 12,
                    fontWeight: 600,
                    mb: 1,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                  }}
                >
                  {t('username')}
                </Typography>
                <TextField
                  fullWidth
                  required
                  placeholder={isAr ? 'po_manager' : 'po_manager'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <User size={16} color="#475569" />
                      </InputAdornment>
                    ),
                  }}
                  sx={fieldSx}
                />
              </Box>

              {/* Password */}
              <Box>
                <Typography
                  sx={{
                    color: '#94a3b8',
                    fontSize: 12,
                    fontWeight: 600,
                    mb: 1,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                  }}
                >
                  {t('password')}
                </Typography>
                <TextField
                  fullWidth
                  required
                  placeholder="••••••••"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock size={16} color="#475569" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPw((v) => !v)}
                          edge="end"
                          size="small"
                          tabIndex={-1}
                          sx={{ color: '#475569', '&:hover': { color: '#94a3b8' } }}
                        >
                          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={fieldSx}
                />
              </Box>

              {/* Submit */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || !username || !password}
                endIcon={
                  !loading &&
                  (isAr ? <ChevronLeft size={18} /> : <ChevronRight size={18} />)
                }
                sx={{
                  mt: 1,
                  py: 1.5,
                  fontWeight: 700,
                  fontSize: 15,
                  borderRadius: 2,
                  background: loading
                    ? 'rgba(29,78,216,0.4)'
                    : 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(29,78,216,0.4)',
                  color: '#fff',
                  letterSpacing: isAr ? 0 : 0.3,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)',
                    boxShadow: '0 6px 25px rgba(29,78,216,0.5)',
                  },
                  '&.Mui-disabled': {
                    background: 'rgba(29,78,216,0.2)',
                    color: 'rgba(255,255,255,0.3)',
                    boxShadow: 'none',
                  },
                  transition: 'all 0.2s',
                }}
              >
                {loading ? (
                  <CircularProgress size={20} sx={{ color: 'rgba(255,255,255,0.6)' }} />
                ) : (
                  t('loginBtn')
                )}
              </Button>
            </Box>

            {/* ── Quick access ── */}
            <Box sx={{ mt: 5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                <Box sx={{ flex: 1, height: '1px', bgcolor: '#1e2d42' }} />
                <Typography sx={{ color: '#334155', fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }}>
                  {t('quickAccess')}
                </Typography>
                <Box sx={{ flex: 1, height: '1px', bgcolor: '#1e2d42' }} />
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 1,
                }}
              >
                {DEMO_USERS.map((u) => {
                  const label = ROLE_LABELS[u.role];
                  return (
                    <Box
                      key={u.username}
                      onClick={() => handleDemoLogin(u.username)}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0.75,
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.03)',
                        border: '1px solid #1e2d42',
                        cursor: 'pointer',
                        transition: 'all 0.18s',
                        '&:hover': {
                          bgcolor: `${label.color}18`,
                          borderColor: `${label.color}60`,
                          transform: 'translateY(-2px)',
                          boxShadow: `0 4px 12px ${label.color}20`,
                        },
                      }}
                    >
                      {/* Avatar */}
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: `${label.color}22`,
                          border: `1.5px solid ${label.color}50`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                          color: label.color,
                          letterSpacing: 0.5,
                        }}
                      >
                        {u.username.slice(0, 2).toUpperCase()}
                      </Box>
                      <Typography
                        sx={{
                          color: '#94a3b8',
                          fontSize: 10,
                          fontWeight: 600,
                          textAlign: 'center',
                          lineHeight: 1.3,
                        }}
                      >
                        {isAr ? label.ar : label.en}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              <Typography
                sx={{
                  textAlign: 'center',
                  color: '#1e3a5f',
                  fontSize: 11,
                  mt: 2,
                  fontFamily: 'monospace',
                  letterSpacing: 0.5,
                }}
              >
                {t('passwordHint')}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            px: { xs: 3, md: 5 },
            py: 2,
            borderTop: '1px solid #1e2d42',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Typography sx={{ color: '#1e3a5f', fontSize: 11 }}>
            Production Management System © 2026
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Field styles ─────────────────────────────────────────────────────────────
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: '#0d1a2e',
    borderRadius: 2,
    color: '#e2e8f0',
    fontSize: 14,
    '& fieldset': {
      borderColor: '#1e2d42',
    },
    '&:hover fieldset': {
      borderColor: '#2d4a6e',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#3b82f6',
      borderWidth: 1.5,
    },
  },
  '& .MuiInputBase-input': {
    color: '#e2e8f0',
    '&::placeholder': { color: '#334155', opacity: 1 },
  },
  '& .MuiInputLabel-root': { display: 'none' },
  '& .MuiInputLabel-shrink': { display: 'none' },
};
