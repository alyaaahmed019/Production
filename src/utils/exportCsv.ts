import { statusConfig } from '../config/statusConfig';
import { SIZE_CODES } from '../config/orderOptions';
import type { ProductionOrder } from '../types/production';

function escapeCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function ordersToCsv(orders: readonly ProductionOrder[]): string {
  const header = [
    'PO',
    'Client',
    'Product',
    'Sizes',
    'Colors',
    'Fabric Quantity',
    'Fabric Unit',
    'Pieces',
    'Status',
    'Progress %',
    'Line',
    'Order Date',
    'Expected Delivery',
  ];
  const rows = orders.map((order) => [
    order.poNumber,
    order.client,
    order.product,
    SIZE_CODES.filter((size) => (order.sizeBreakdown[size] ?? 0) > 0).join(' / '),
    order.colors.join(' / '),
    order.fabricQuantity,
    order.fabricUnit,
    order.totalPieces,
    statusConfig[order.status].label,
    order.progress,
    order.assignedLine ?? '',
    order.orderDate,
    order.expectedDeliveryDate,
  ]);
  return [header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
}

export function downloadOrdersCsv(orders: readonly ProductionOrder[], filename: string): void {
  const blob = new Blob([`\uFEFF${ordersToCsv(orders)}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
