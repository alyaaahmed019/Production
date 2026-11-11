import { Fragment } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { Check } from 'lucide-react';
import { statusConfig } from '../../config/statusConfig';
import { statusIcons } from '../../config/statusIcons';
import { COMMON_STAGES, LINE_ROUTES } from '../../config/workflowConfig';
import { tokens } from '../../theme';
import type { ProductionLine, ProductionOrder, ProductionStatus, StageState } from '../../types/production';
import { getStageState } from '../../utils/workflow';

interface WorkflowDiagramProps {
  order: ProductionOrder;
}

const NODE_HEIGHT = 44;
const LANE_GAP = 20;
const DASH = (color: string) => `2px dashed ${color}`;

function Connector({ active }: { active: boolean }) {
  return (
    <Box
      aria-hidden
      sx={{ flex: '0 0 28px', alignSelf: 'center', borderTop: DASH(active ? tokens.stitch : '#C5CCD6') }}
    />
  );
}

function StageNode({ status, state }: { status: ProductionStatus; state: StageState }) {
  const config = statusConfig[status];
  const Icon = statusIcons[status];

  const stateStyles = {
    done: { bgcolor: config.background, color: config.color, border: `1px solid ${config.color}55` },
    current: {
      bgcolor: config.color,
      color: '#FFFFFF',
      border: `1px solid ${config.color}`,
      boxShadow: `0 0 0 3px ${config.color}33`,
    },
    upcoming: { bgcolor: tokens.surface, color: tokens.textSecondary, border: '1px dashed #C5CCD6' },
    skipped: { bgcolor: 'transparent', color: tokens.textMuted, border: `1px dashed ${tokens.lineSoft}` },
  }[state];

  const stateLabel = { done: 'completed', current: 'current stage', upcoming: 'upcoming', skipped: 'not used' }[state];

  return (
    <Box
      role="listitem"
      aria-label={`${config.label}, ${stateLabel}`}
      aria-current={state === 'current' ? 'step' : undefined}
      sx={{
        height: NODE_HEIGHT,
        minWidth: 118,
        px: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.75,
        borderRadius: '8px',
        fontSize: '0.8125rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        opacity: state === 'skipped' ? 0.75 : 1,
        ...stateStyles,
      }}
    >
      {state === 'done' ? <Check size={15} aria-hidden /> : <Icon size={15} aria-hidden />}
      {config.label}
    </Box>
  );
}

function Lane({ line, order }: { line: ProductionLine; order: ProductionOrder }) {
  const route = LINE_ROUTES[line];
  const state = getStageState(order, route.destination);
  const chosen = order.assignedLine === line;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: NODE_HEIGHT }}>
      <Typography
        variant="caption"
        sx={{ width: 50, fontWeight: chosen ? 700 : 500, color: chosen ? 'text.primary' : 'text.secondary' }}
      >
        {route.label}
      </Typography>
      <Box aria-hidden sx={{ flex: '0 0 18px', borderTop: DASH(chosen ? tokens.stitch : '#C5CCD6') }} />
      <StageNode status={route.destination} state={state} />
    </Box>
  );
}

export function WorkflowDiagram({ order }: WorkflowDiagramProps) {
  const completed = order.status === 'COMPLETED';
  const bracketMargin = `${NODE_HEIGHT / 2}px`;
  const bracketBorder = DASH(order.assignedLine ? tokens.stitch : '#C5CCD6');

  return (
    <Box>
      <Box sx={{ overflowX: 'auto', pb: 1 }}>
        <Box role="list" aria-label="Production workflow" sx={{ display: 'flex', alignItems: 'center', minWidth: 'max-content', py: 1 }}>
          {COMMON_STAGES.map((stage, index) => (
            <Fragment key={stage}>
              {index > 0 && <Connector active={getStageState(order, stage) !== 'upcoming'} />}
              <StageNode status={stage} state={getStageState(order, stage)} />
            </Fragment>
          ))}

          <Connector active={getStageState(order, 'SEWING') === 'done'} />

          {/* Branch after sewing: Line 1 → Random QC, Line 2 → Inventory */}
          <Box
            aria-hidden
            sx={{ alignSelf: 'stretch', width: 18, my: bracketMargin, borderLeft: bracketBorder, borderTop: bracketBorder, borderBottom: bracketBorder }}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${LANE_GAP}px` }}>
            <Lane line={1} order={order} />
            <Lane line={2} order={order} />
          </Box>
          <Box
            aria-hidden
            sx={{ alignSelf: 'stretch', width: 18, my: bracketMargin, borderRight: bracketBorder, borderTop: bracketBorder, borderBottom: bracketBorder }}
          />

          <Connector active={completed} />
          <StageNode status="COMPLETED" state={getStageState(order, 'COMPLETED')} />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mt: 1.5 }}>
        {order.assignedLine ? (
          <Chip
            size="small"
            variant="outlined"
            label={`Assigned to ${LINE_ROUTES[order.assignedLine].label} → ${LINE_ROUTES[order.assignedLine].destinationLabel}`}
          />
        ) : (
          <Chip size="small" variant="outlined" label="Line not assigned yet" />
        )}
        <Typography variant="caption" color="text.secondary">
          After sewing, Line 1 goes to Random QC and Line 2 goes to Inventory.
        </Typography>
      </Box>
    </Box>
  );
}
