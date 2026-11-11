import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { tokens } from '../../theme';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Rendered above the title, e.g. a back link. */
  leading?: ReactNode;
  /** Rendered next to the title, e.g. a status badge. */
  titleAdornment?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, leading, titleAdornment, actions }: PageHeaderProps) {
  return (
    <Box
      component="header"
      sx={{
        mb: 3,
        pb: 2.5,
        // Dashed amber rule: the stitch line that recurs through the workflow views.
        borderBottom: `2px dashed ${tokens.stitch}66`,
      }}
    >
      {leading && <Box sx={{ mb: 1 }}>{leading}</Box>}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
            <Typography variant="h5" component="h1">
              {title}
            </Typography>
            {titleAdornment}
          </Box>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>{actions}</Box>}
      </Box>
    </Box>
  );
}
