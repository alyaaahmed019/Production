import type { ProductionLine, ProductionStatus } from '../types/production';

/** Which statuses an order may move to next. Sewing branches by production line. */
export const STATUS_TRANSITIONS: Record<ProductionStatus, readonly ProductionStatus[]> = {
  PENDING: ['CUTTING'],
  CUTTING: ['SORTING'],
  SORTING: ['SEWING'],
  SEWING: ['QUALITY_CHECK', 'INVENTORY'],
  QUALITY_CHECK: ['COMPLETED'],
  INVENTORY: ['COMPLETED'],
  COMPLETED: [],
};

/** After sewing, the line decides the next stage. */
export const LINE_ROUTES: Record<
  ProductionLine,
  { label: string; destination: ProductionStatus; destinationLabel: string }
> = {
  1: { label: 'Line 1', destination: 'QUALITY_CHECK', destinationLabel: 'Random QC' },
  2: { label: 'Line 2', destination: 'INVENTORY', destinationLabel: 'Inventory' },
};

/** Stages every order passes through before the line branch. */
export const COMMON_STAGES: readonly ProductionStatus[] = [
  'PENDING',
  'CUTTING',
  'SORTING',
  'SEWING',
];
