import { LINE_ROUTES } from '../config/workflowConfig';
import { statusConfig } from '../config/statusConfig';
import type {
  FabricUnit,
  ProductionHistoryEvent,
  ProductionLine,
  ProductionOrder,
  ProductionStatus,
  SizeBreakdown,
} from '../types/production';
import { getStatusRank } from '../utils/workflow';

interface OrderSeed {
  id: string;
  po: string;
  client: string;
  product: string;
  fabric: Record<string, number>;
  unit?: FabricUnit;
  sizes: SizeBreakdown;
  status: ProductionStatus;
  progress: number;
  orderDate: string;
  expected: string;
  line?: ProductionLine;
}

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

function buildOrder(seed: OrderSeed): ProductionOrder {
  return {
    id: seed.id,
    poNumber: seed.po,
    client: seed.client,
    product: seed.product,
    colors: Object.keys(seed.fabric),
    fabricByColor: seed.fabric,
    fabricQuantity: sum(Object.values(seed.fabric)),
    fabricUnit: seed.unit ?? 'kg',
    totalPieces: sum(Object.values(seed.sizes).map((value) => value ?? 0)),
    sizeBreakdown: seed.sizes,
    status: seed.status,
    progress: seed.progress,
    orderDate: seed.orderDate,
    expectedDeliveryDate: seed.expected,
    assignedLine: seed.line,
  };
}

const seeds: OrderSeed[] = [
  { id: '1', po: 'PO-2026-001', client: 'ABC Fashion', product: 'Basic T-Shirt', fabric: { Black: 850 }, sizes: { S: 800, M: 1500, L: 1700, XL: 1000 }, status: 'CUTTING', progress: 35, orderDate: '2026-10-27', expected: '2026-11-30' },
  { id: '2', po: 'PO-2026-002', client: 'Nile Apparel', product: 'Polo Shirt', fabric: { Navy: 620 }, sizes: { S: 400, M: 900, L: 1100, XL: 600, XXL: 200 }, status: 'SEWING', progress: 60, orderDate: '2026-10-20', expected: '2026-11-25' },
  { id: '3', po: 'PO-2026-003', client: 'UrbanThread', product: 'Hooded Sweatshirt', fabric: { Charcoal: 900, Black: 500 }, sizes: { S: 300, M: 700, L: 800, XL: 500, XXL: 100 }, status: 'PENDING', progress: 0, orderDate: '2026-11-05', expected: '2026-12-20' },
  { id: '4', po: 'PO-2026-004', client: 'Delta Garments', product: 'Work Uniform Shirt', fabric: { 'Royal Blue': 540 }, sizes: { S: 200, M: 600, L: 700, XL: 400, XXL: 100 }, status: 'SORTING', progress: 40, orderDate: '2026-10-30', expected: '2026-12-02' },
  { id: '5', po: 'PO-2026-005', client: 'Cairo Casuals', product: 'Crew Neck Sweatshirt', fabric: { 'Heather Grey': 980 }, sizes: { S: 600, M: 1100, L: 1300, XL: 900, XXL: 300 }, status: 'QUALITY_CHECK', progress: 80, orderDate: '2026-10-12', expected: '2026-11-20', line: 1 },
  { id: '6', po: 'PO-2026-006', client: 'Sahara Sportswear', product: 'Training Tee', fabric: { White: 520, Lime: 210 }, sizes: { S: 350, M: 800, L: 900, XL: 450 }, status: 'INVENTORY', progress: 90, orderDate: '2026-10-05', expected: '2026-11-18', line: 2 },
  { id: '7', po: 'PO-2026-007', client: 'ABC Fashion', product: 'Long Sleeve Tee', fabric: { White: 410 }, sizes: { S: 300, M: 800, L: 900, XL: 500 }, status: 'COMPLETED', progress: 100, orderDate: '2026-09-15', expected: '2026-10-25', line: 1 },
  { id: '8', po: 'PO-2026-008', client: 'Nile Apparel', product: 'Piqué Polo', fabric: { 'Forest Green': 705 }, sizes: { S: 250, M: 700, L: 850, XL: 500, XXL: 100 }, status: 'COMPLETED', progress: 100, orderDate: '2026-09-22', expected: '2026-11-02', line: 2 },
  { id: '9', po: 'PO-2026-009', client: 'UrbanThread', product: 'Jogger Pants', fabric: { Black: 700, Olive: 450 }, sizes: { S: 400, M: 900, L: 1000, XL: 700, XXL: 200 }, status: 'CUTTING', progress: 25, orderDate: '2026-11-02', expected: '2026-12-10' },
  { id: '10', po: 'PO-2026-010', client: 'Delta Garments', product: 'Scrub Top', fabric: { Teal: 380 }, sizes: { S: 300, M: 600, L: 500, XL: 200 }, status: 'PENDING', progress: 0, orderDate: '2026-11-07', expected: '2026-12-15' },
  { id: '11', po: 'PO-2026-011', client: 'Cairo Casuals', product: 'V-Neck Tee', fabric: { Burgundy: 300, Navy: 280 }, sizes: { S: 250, M: 650, L: 750, XL: 450, XXL: 100 }, status: 'SEWING', progress: 60, orderDate: '2026-10-22', expected: '2026-11-28' },
  { id: '12', po: 'PO-2026-012', client: 'Sahara Sportswear', product: 'Track Jacket', fabric: { Red: 620, White: 180 }, sizes: { S: 200, M: 500, L: 600, XL: 400 }, status: 'SORTING', progress: 40, orderDate: '2026-10-28', expected: '2026-12-05' },
];

export const mockOrders: ProductionOrder[] = seeds.map(buildOrder);

// ---------------------------------------------------------------------------
// Production history (generated from each order's status so it stays consistent)
// ---------------------------------------------------------------------------

interface HistoryStep {
  minRank: number;
  offsetDays: number;
  hour: number;
  user: string;
  action: (order: ProductionOrder) => string;
  note?: (order: ProductionOrder) => string | undefined;
  when?: (order: ProductionOrder) => boolean;
}

const HISTORY_STEPS: HistoryStep[] = [
  { minRank: 0, offsetDays: 0, hour: 9, user: 'Layla Farouk', action: () => 'Order Created', note: () => 'PO received from client.' },
  { minRank: 1, offsetDays: 2, hour: 10, user: 'Omar Said', action: () => 'Fabric Received', note: (o) => `${o.fabricQuantity} ${o.fabricUnit} received and inspected.` },
  { minRank: 1, offsetDays: 3, hour: 8, user: 'Hassan Ibrahim', action: () => 'Cutting Started' },
  { minRank: 1, offsetDays: 5, hour: 15, user: 'Hassan Ibrahim', action: () => 'Cutting 50% Complete', when: (o) => getStatusRank(o.status) > 1 || o.progress >= 30 },
  { minRank: 2, offsetDays: 7, hour: 14, user: 'Hassan Ibrahim', action: () => 'Cutting Completed', note: () => 'Bundles tagged and handed to sorting.' },
  { minRank: 3, offsetDays: 8, hour: 16, user: 'Nadia Samir', action: () => 'Sorting Completed' },
  { minRank: 3, offsetDays: 9, hour: 8, user: 'Youssef Gamal', action: () => 'Sewing Started' },
  { minRank: 4, offsetDays: 14, hour: 15, user: 'Youssef Gamal', action: () => 'Sewing Completed' },
  {
    minRank: 4,
    offsetDays: 14,
    hour: 16,
    user: 'Youssef Gamal',
    action: (o) => (o.assignedLine ? `Assigned to ${LINE_ROUTES[o.assignedLine].label}` : 'Line Assigned'),
    note: (o) => (o.assignedLine ? `Next stage: ${LINE_ROUTES[o.assignedLine].destinationLabel}.` : undefined),
  },
  { minRank: 5, offsetDays: 18, hour: 11, user: 'Salma Nabil', action: () => `Order ${statusConfig.COMPLETED.label}`, note: () => 'Ready for delivery.' },
];

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function buildHistory(order: ProductionOrder): ProductionHistoryEvent[] {
  const rank = getStatusRank(order.status);
  return HISTORY_STEPS.filter((step) => rank >= step.minRank && (step.when?.(order) ?? true)).map(
    (step, index) => ({
      id: `${order.id}-evt-${index + 1}`,
      orderId: order.id,
      timestamp: `${addDays(order.orderDate, step.offsetDays)}T${String(step.hour).padStart(2, '0')}:00:00`,
      action: step.action(order),
      user: step.user,
      note: step.note?.(order),
    }),
  );
}

export const mockHistory: Record<string, ProductionHistoryEvent[]> = Object.fromEntries(
  mockOrders.map((order) => [order.id, buildHistory(order)]),
);
