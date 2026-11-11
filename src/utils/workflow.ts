import { LINE_ROUTES, STATUS_TRANSITIONS } from '../config/workflowConfig';
import type {
  ProductionLine,
  ProductionOrder,
  ProductionStatus,
  StageState,
} from '../types/production';

/**
 * Position in the workflow. Quality Check and Inventory share a rank because
 * they are the two parallel branches after sewing.
 */
export function getStatusRank(status: ProductionStatus): number {
  switch (status) {
    case 'PENDING':
      return 0;
    case 'CUTTING':
      return 1;
    case 'SORTING':
      return 2;
    case 'SEWING':
      return 3;
    case 'QUALITY_CHECK':
    case 'INVENTORY':
      return 4;
    case 'COMPLETED':
      return 5;
  }
}

export function getAllowedTransitions(status: ProductionStatus): readonly ProductionStatus[] {
  return STATUS_TRANSITIONS[status];
}

export function isTransitionAllowed(from: ProductionStatus, to: ProductionStatus): boolean {
  return STATUS_TRANSITIONS[from].includes(to);
}

/** The line implied by entering a branch status, if any. */
export function getLineForStatus(status: ProductionStatus): ProductionLine | undefined {
  if (status === 'QUALITY_CHECK') return 1;
  if (status === 'INVENTORY') return 2;
  return undefined;
}

export function getStageState(order: ProductionOrder, stage: ProductionStatus): StageState {
  const orderRank = getStatusRank(order.status);
  const stageRank = getStatusRank(stage);

  if (stageRank !== 4) {
    if (stage === order.status) return order.status === 'COMPLETED' ? 'done' : 'current';
    return stageRank < orderRank ? 'done' : 'upcoming';
  }

  // Branch stage (Quality Check / Inventory)
  if (orderRank < 4) return 'upcoming';
  const laneStage = order.assignedLine ? LINE_ROUTES[order.assignedLine].destination : undefined;
  if (orderRank === 4) return stage === order.status ? 'current' : 'skipped';
  return !laneStage || stage === laneStage ? 'done' : 'skipped';
}

/** Short explanation shown when picking a target status. */
export function getTransitionHint(target: ProductionStatus): string | undefined {
  const line = getLineForStatus(target);
  if (!line) return undefined;
  const route = LINE_ROUTES[line];
  return `Sewing is done — the order is assigned to ${route.label} and moves to ${route.destinationLabel}.`;
}
