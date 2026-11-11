import { Box, Chip } from '@mui/material';
import { statusConfig } from '../../config/statusConfig';
import type { ProductionStatus } from '../../types/production';

interface OrderStatusBadgeProps {
  status: ProductionStatus;
  size?: 'small' | 'medium';
}

export function OrderStatusBadge({ status, size = 'small' }: OrderStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Chip
      size={size}
      label={config.label}
      icon={
        <Box
          component="span"
          aria-hidden
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            bgcolor: config.color,
            // Chip icons carry large default margins; tighten them for a dot.
            ml: '9px !important',
            mr: '-3px !important',
          }}
        />
      }
      sx={{
        bgcolor: config.background,
        color: config.color,
        border: `1px solid ${config.color}33`,
        '& .MuiChip-label': { px: 1.25 },
      }}
    />
  );
}
