import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

interface DetailFieldProps {
  label: string;
  children: ReactNode;
}

export function DetailField({ label, children }: DetailFieldProps) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" component="dt">
        {label}
      </Typography>
      <Typography variant="body2" component="dd" sx={{ m: 0, mt: 0.25, fontWeight: 500, fontSize: '0.875rem' }}>
        {children}
      </Typography>
    </Box>
  );
}
