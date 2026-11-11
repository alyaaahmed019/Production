import { Box, Paper, Skeleton, Typography } from '@mui/material';
import { ClipboardList, type LucideIcon } from 'lucide-react';
import { statusConfig } from '../../config/statusConfig';
import { statusIcons } from '../../config/statusIcons';
import { tokens } from '../../theme';
import type { OrderSummary } from '../../types/production';
import { formatNumber } from '../../utils/format';

interface OrderSummaryCardsProps {
  summary: OrderSummary;
  loading?: boolean;
}

interface CardDefinition {
  key: keyof OrderSummary;
  label: string;
  icon: LucideIcon;
  color: string;
  background: string;
}

// Cards reuse the status palette so "Pending" and "Completed" read the same everywhere.
const CARDS: CardDefinition[] = [
  { key: 'total', label: 'Total Orders', icon: ClipboardList, color: tokens.ink, background: '#E6EAF0' },
  { key: 'pending', label: 'Pending', icon: statusIcons.PENDING, color: statusConfig.PENDING.color, background: statusConfig.PENDING.background },
  { key: 'inProduction', label: 'In Production', icon: statusIcons.SEWING, color: statusConfig.CUTTING.color, background: statusConfig.CUTTING.background },
  { key: 'completed', label: 'Completed', icon: statusIcons.COMPLETED, color: statusConfig.COMPLETED.color, background: statusConfig.COMPLETED.background },
];

export function OrderSummaryCards({ summary, loading }: OrderSummaryCardsProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
      }}
    >
      {CARDS.map(({ key, label, icon: Icon, color, background }) => (
        <Paper key={key} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              flexShrink: 0,
              borderRadius: '8px',
              display: 'grid',
              placeItems: 'center',
              bgcolor: background,
              color,
            }}
          >
            <Icon size={22} aria-hidden />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            {loading ? (
              <Skeleton width={56} height={36} />
            ) : (
              <Typography sx={{ fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.2 }}>
                {formatNumber(summary[key])}
              </Typography>
            )}
          </Box>
        </Paper>
      ))}
    </Box>
  );
}
