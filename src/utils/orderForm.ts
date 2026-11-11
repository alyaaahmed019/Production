import { SIZE_CODES } from '../config/orderOptions';
import type {
  FabricUnit,
  ProductionOrder,
  ProductionOrderInput,
  SizeBreakdown,
  SizeCode,
} from '../types/production';

export interface ColorRowValues {
  id: string;
  color: string;
  fabricQuantity: string;
}

export interface OrderFormValues {
  client: string;
  poNumber: string;
  orderDate: string;
  expectedDeliveryDate: string;
  product: string;
  fabricUnit: FabricUnit;
  colors: ColorRowValues[];
  sizes: Record<SizeCode, string>;
}

export interface OrderFormErrors {
  client?: string;
  poNumber?: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  product?: string;
  colors?: Record<string, { color?: string; fabricQuantity?: string }>;
  sizes?: Partial<Record<SizeCode, string>>;
  piecesTotal?: string;
}

let rowCounter = 0;
export function newColorRow(color = '', fabricQuantity = ''): ColorRowValues {
  rowCounter += 1;
  return { id: `color-row-${rowCounter}`, color, fabricQuantity };
}

export function emptyOrderFormValues(today: string): OrderFormValues {
  return {
    client: '',
    poNumber: '',
    orderDate: today,
    expectedDeliveryDate: '',
    product: '',
    fabricUnit: 'kg',
    colors: [newColorRow()],
    sizes: { S: '', M: '', L: '', XL: '', XXL: '' },
  };
}

export function orderToFormValues(order: ProductionOrder): OrderFormValues {
  const sizes = { S: '', M: '', L: '', XL: '', XXL: '' } as Record<SizeCode, string>;
  for (const size of SIZE_CODES) {
    const quantity = order.sizeBreakdown[size];
    sizes[size] = quantity ? String(quantity) : '';
  }
  return {
    client: order.client,
    poNumber: order.poNumber,
    orderDate: order.orderDate,
    expectedDeliveryDate: order.expectedDeliveryDate,
    product: order.product,
    fabricUnit: order.fabricUnit,
    colors: order.colors.map((color) => newColorRow(color, String(order.fabricByColor[color] ?? ''))),
    sizes,
  };
}

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculateTotals(values: OrderFormValues): { pieces: number; fabric: number } {
  const pieces = SIZE_CODES.reduce((sum, size) => sum + Math.max(0, toNumber(values.sizes[size])), 0);
  const fabric = values.colors.reduce((sum, row) => sum + Math.max(0, toNumber(row.fabricQuantity)), 0);
  return { pieces, fabric: Math.round(fabric * 100) / 100 };
}

export function formValuesToInput(values: OrderFormValues): ProductionOrderInput {
  const fabricByColor: Record<string, number> = {};
  for (const row of values.colors) {
    fabricByColor[row.color.trim()] = toNumber(row.fabricQuantity);
  }
  const sizeBreakdown: SizeBreakdown = {};
  for (const size of SIZE_CODES) {
    const quantity = toNumber(values.sizes[size]);
    if (quantity > 0) sizeBreakdown[size] = quantity;
  }
  const totals = calculateTotals(values);
  return {
    client: values.client.trim(),
    poNumber: values.poNumber.trim().toUpperCase(),
    product: values.product.trim(),
    orderDate: values.orderDate,
    expectedDeliveryDate: values.expectedDeliveryDate,
    colors: values.colors.map((row) => row.color.trim()),
    fabricByColor,
    fabricQuantity: totals.fabric,
    fabricUnit: values.fabricUnit,
    totalPieces: totals.pieces,
    sizeBreakdown,
  };
}

export function validateOrderForm(values: OrderFormValues): OrderFormErrors {
  const errors: OrderFormErrors = {};

  if (!values.client.trim()) errors.client = 'Enter the client name.';
  if (!values.poNumber.trim()) errors.poNumber = 'Enter the PO number.';
  else if (!/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(values.poNumber.trim()))
    errors.poNumber = 'Use letters, numbers and dashes only, e.g. PO-2026-013.';
  if (!values.orderDate) errors.orderDate = 'Select the order date.';
  if (!values.expectedDeliveryDate) errors.expectedDeliveryDate = 'Select the expected delivery date.';
  else if (values.orderDate && values.expectedDeliveryDate < values.orderDate)
    errors.expectedDeliveryDate = 'Delivery date must be on or after the order date.';
  if (values.product.trim().length < 3) errors.product = 'Describe the product, e.g. Basic T-Shirt.';

  const seenColors = new Set<string>();
  for (const row of values.colors) {
    const rowErrors: { color?: string; fabricQuantity?: string } = {};
    const name = row.color.trim().toLowerCase();
    if (!name) rowErrors.color = 'Enter a color.';
    else if (seenColors.has(name)) rowErrors.color = 'This color is already listed.';
    seenColors.add(name);
    if (!(toNumber(row.fabricQuantity) > 0)) rowErrors.fabricQuantity = 'Enter a quantity above 0.';
    if (rowErrors.color || rowErrors.fabricQuantity) {
      errors.colors = { ...errors.colors, [row.id]: rowErrors };
    }
  }

  const sizeErrors: Partial<Record<SizeCode, string>> = {};
  for (const size of SIZE_CODES) {
    const raw = values.sizes[size].trim();
    if (raw === '') continue;
    const quantity = Number(raw);
    if (!Number.isInteger(quantity) || quantity < 0) sizeErrors[size] = 'Whole number, 0 or more.';
  }
  if (Object.keys(sizeErrors).length > 0) errors.sizes = sizeErrors;
  else if (calculateTotals(values).pieces <= 0) errors.piecesTotal = 'Enter a quantity for at least one size.';

  return errors;
}

export function hasErrors(errors: OrderFormErrors): boolean {
  return Object.keys(errors).length > 0;
}
