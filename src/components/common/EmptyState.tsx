import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
      <Box
        sx={{
          width: 48,
          height: 48,
          mx: 'auto',
          mb: 2,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: '#EEF1F5',
          color: 'text.secondary',
        }}
      >
        <Icon size={22} aria-hidden />
      </Box>
      <Typography variant="subtitle1">{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: action ? 2.5 : 0 }}>
        {message}
      </Typography>
      {action}
    </Box>
  );
}
