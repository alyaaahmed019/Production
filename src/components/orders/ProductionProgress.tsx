import { Box, LinearProgress, Typography } from '@mui/material';
import { statusConfig } from '../../config/statusConfig';
import type { ProductionStatus } from '../../types/production';

interface ProductionProgressProps {
  value: number;
  status: ProductionStatus;
}

export function ProductionProgress({ value, status }: ProductionProgressProps) {
  const color = statusConfig[status].color;
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 130 }}>
      <LinearProgress
        variant="determinate"
        value={clamped}
        aria-label={`Production progress ${clamped}%`}
        sx={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          bgcolor: '#E6EAF0',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
        }}
      />
      <Typography variant="caption" sx={{ width: 34, textAlign: 'right', fontWeight: 600 }}>
        {clamped}%
      </Typography>
    </Box>
  );
}
