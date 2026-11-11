import { Box, Typography } from '@mui/material';
import { tokens } from '../../theme';
import type { ProductionHistoryEvent } from '../../types/production';
import { formatDateTime } from '../../utils/format';

interface ProductionTimelineProps {
  events: readonly ProductionHistoryEvent[];
}

export function ProductionTimeline({ events }: ProductionTimelineProps) {
  return (
    <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        return (
          <Box
            component="li"
            key={event.id}
            sx={{ display: 'grid', gridTemplateColumns: '20px 1fr', columnGap: 1.75, position: 'relative' }}
          >
            <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <Box
                aria-hidden
                sx={{
                  width: 10,
                  height: 10,
                  mt: '5px',
                  borderRadius: '50%',
                  bgcolor: isLast ? tokens.stitch : tokens.ink,
                  boxShadow: isLast ? `0 0 0 4px ${tokens.stitch}33` : 'none',
                  zIndex: 1,
                }}
              />
              {!isLast && (
                <Box
                  aria-hidden
                  sx={{
                    position: 'absolute',
                    top: 18,
                    bottom: -6,
                    borderLeft: `2px dashed ${tokens.line}`,
                  }}
                />
              )}
            </Box>
            <Box sx={{ pb: isLast ? 0 : 2.5, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary">
                {formatDateTime(event.timestamp)}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                {event.action}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                by {event.user}
              </Typography>
              {event.note && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  {event.note}
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
