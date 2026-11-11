import type { ReactNode } from 'react';
import { Box, Paper, Typography } from '@mui/material';

interface SectionCardProps {
  title: string;
  description?: string;
  action?: ReactNode;
  id?: string;
  /** Remove body padding (for tables that should run edge to edge). */
  flush?: boolean;
  children: ReactNode;
}

export function SectionCard({ title, description, action, id, flush, children }: SectionCardProps) {
  return (
    <Paper component="section" id={id} sx={{ scrollMarginTop: 80 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          px: 2.5,
          py: 1.75,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" component="h2">
            {title}
          </Typography>
          {description && (
            <Typography variant="caption" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
      <Box sx={flush ? undefined : { p: 2.5 }}>{children}</Box>
    </Paper>
  );
}
