import type { ProductionStatus } from '../types/production';

export interface StatusConfigEntry {
  label: string;
  /** Text / accent color */
  color: string;
  /** Soft tinted background for badges */
  background: string;
  /** Default progress when an order enters this status */
  progress: number;
  description: string;
}

/** Single source of truth for every status color / label in the app. */
export const statusConfig: Record<ProductionStatus, StatusConfigEntry> = {
  PENDING: {
    label: 'Pending',
    color: '#8A6410',
    background: '#F7F0DC',
    progress: 0,
    description: 'Order received, waiting for fabric and cutting to start.',
  },
  CUTTING: {
    label: 'Cutting',
    color: '#1F55C9',
    background: '#E5ECFB',
    progress: 25,
    description: 'Fabric is being laid and cut into pieces.',
  },
  SORTING: {
    label: 'Sorting',
    color: '#6D3FC0',
    background: '#EDE7FA',
    progress: 40,
    description: 'Cut pieces are being bundled and sorted by size and color.',
  },
  SEWING: {
    label: 'Sewing',
    color: '#B45309',
    background: '#FCEBD6',
    progress: 60,
    description: 'Pieces are on the sewing lines.',
  },
  QUALITY_CHECK: {
    label: 'Quality Check',
    color: '#B93815',
    background: '#FCE5DD',
    progress: 80,
    description: 'Line 1 output is going through random quality checks.',
  },
  INVENTORY: {
    label: 'Inventory',
    color: '#0F766E',
    background: '#DAF2EF',
    progress: 90,
    description: 'Line 2 output has been moved to inventory.',
  },
  COMPLETED: {
    label: 'Completed',
    color: '#157A3C',
    background: '#DCF3E3',
    progress: 100,
    description: 'Order is finished.',
  },
};

export const STATUS_ORDER: readonly ProductionStatus[] = [
  'PENDING',
  'CUTTING',
  'SORTING',
  'SEWING',
  'QUALITY_CHECK',
  'INVENTORY',
  'COMPLETED',
];

export const statusOptions = STATUS_ORDER.map((value) => ({
  value,
  label: statusConfig[value].label,
}));
