export type ProductionStatus =
  | 'PENDING'
  | 'CUTTING'
  | 'SORTING'
  | 'SEWING'
  | 'QUALITY_CHECK'
  | 'INVENTORY'
  | 'COMPLETED';

export type ProductionLine = 1 | 2;
export type SizeCode = 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type FabricUnit = 'kg' | 'm' | 'yd';
export type SizeBreakdown = Partial<Record<SizeCode, number>>;

export interface ProductionOrder {
  id: string;
  poNumber: string;
  client: string;
  product: string;
  colors: string[];
  /** Fabric per color, in `fabricUnit`. `fabricQuantity` is always their sum. */
  fabricByColor: Record<string, number>;
  fabricQuantity: number;
  fabricUnit: FabricUnit;
  totalPieces: number;
  sizeBreakdown: SizeBreakdown;
  status: ProductionStatus;
  progress: number;
  orderDate: string; // YYYY-MM-DD
  expectedDeliveryDate: string; // YYYY-MM-DD
  assignedLine?: ProductionLine;
}

/** Payload for creating / editing an order. Status, progress and line are managed by the workflow. */
export type ProductionOrderInput = Omit<
  ProductionOrder,
  'id' | 'status' | 'progress' | 'assignedLine'
>;

export interface ProductionHistoryEvent {
  id: string;
  orderId: string;
  timestamp: string; // ISO local datetime
  action: string;
  user: string;
  note?: string;
}

export interface OrderFilterValues {
  search: string;
  client: string;
  status: ProductionStatus | '';
  color: string;
  dateFrom: string;
  dateTo: string;
}

export interface OrderSummary {
  total: number;
  pending: number;
  inProduction: number;
  completed: number;
}

export type StageState = 'done' | 'current' | 'upcoming' | 'skipped';
