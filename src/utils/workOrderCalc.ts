import type { AccessoryLine, ColorLine, FabricSpec, SizeLabel, WorkOrderInput } from '../types/workOrder';

/** Removes floating-point noise (e.g. 275.00000000000006) before rounding up. */
function roundNoise(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function sumValues(record: Record<string, number>): number {
  return Object.values(record).reduce((total, value) => total + value, 0);
}

/** Pieces in one bag = sum of the ratio over the sizes that belong to this order. */
export function bagSize(ratio: Record<SizeLabel, number>, sizes: readonly SizeLabel[]): number {
  return sizes.reduce((total, size) => total + Math.max(0, Math.floor(ratio[size] ?? 0)), 0);
}

export interface ColorPlan {
  bagSize: number;
  /** True when the order quantity is an exact number of bags. */
  isWholeBags: boolean;
  /** Closest valid quantities below / above the entered one (equal when it is already valid). */
  lowerQuantity: number;
  upperQuantity: number;
  orderBags: number;
  /** Bags to cut = order bags + extra %, rounded up to a whole bag. */
  cutBags: number;
  orderPerSize: Record<SizeLabel, number>;
  cutPerSize: Record<SizeLabel, number>;
  orderPieces: number;
  cutPieces: number;
  extraPieces: number;
}

export function planColor(color: ColorLine, sizes: readonly SizeLabel[]): ColorPlan {
  const perBag = bagSize(color.ratio, sizes);
  const quantity = Number.isFinite(color.orderQuantity) ? Math.max(0, color.orderQuantity) : 0;
  const isInteger = Number.isInteger(quantity);
  const isWholeBags = perBag > 0 && isInteger && quantity % perBag === 0;

  const multiplier = perBag > 0 ? quantity / perBag : 0;
  const orderBags = Math.floor(multiplier);
  const extra = Number.isFinite(color.extraPercent) ? Math.max(0, color.extraPercent) : 0;
  const cutBags = Math.ceil(roundNoise(multiplier * (1 + extra / 100)));

  const orderPerSize: Record<SizeLabel, number> = {};
  const cutPerSize: Record<SizeLabel, number> = {};
  for (const size of sizes) {
    const inBag = Math.max(0, Math.floor(color.ratio[size] ?? 0));
    orderPerSize[size] = Math.round(multiplier * inBag);
    cutPerSize[size] = Math.round(cutBags * inBag);
  }

  const orderPieces = Math.round(multiplier * perBag);
  const cutPieces = cutBags * perBag;
  return {
    bagSize: perBag,
    isWholeBags,
    lowerQuantity: orderBags * perBag,
    upperQuantity: isWholeBags ? quantity : (orderBags + 1) * perBag,
    orderBags,
    cutBags,
    orderPerSize,
    cutPerSize,
    orderPieces,
    cutPieces,
    extraPieces: cutPieces - orderPieces,
  };
}

export interface WorkOrderTotals {
  /** Sum of the quantities typed on the color lines. */
  orderedPieces: number;
  /** Pieces to cut, including each color's extra percentage. */
  cutPieces: number;
  extraPieces: number;
  poPieces: number;
  /** PO total minus color total. Zero when they agree. */
  poDifference: number;
  orderedPerSize: Record<SizeLabel, number>;
  cutPerSize: Record<SizeLabel, number>;
}

export function calculateWorkOrderTotals(
  order: Pick<WorkOrderInput, 'sizes' | 'colors' | 'pos'>,
): WorkOrderTotals {
  const orderedPerSize: Record<SizeLabel, number> = {};
  const cutPerSize: Record<SizeLabel, number> = {};
  for (const size of order.sizes) {
    orderedPerSize[size] = 0;
    cutPerSize[size] = 0;
  }

  let orderedPieces = 0;
  let cutPieces = 0;
  for (const color of order.colors) {
    const plan = planColor(color, order.sizes);
    orderedPieces += Math.max(0, Number.isFinite(color.orderQuantity) ? color.orderQuantity : 0);
    cutPieces += plan.cutPieces;
    for (const size of order.sizes) {
      orderedPerSize[size] += plan.orderPerSize[size];
      cutPerSize[size] += plan.cutPerSize[size];
    }
  }

  const poPieces = order.pos.reduce(
    (total, po) => total + (Number.isFinite(po.quantity) ? Math.max(0, po.quantity) : 0),
    0,
  );
  return {
    orderedPieces,
    cutPieces,
    extraPieces: cutPieces - sumValues(orderedPerSize),
    poPieces,
    poDifference: poPieces - orderedPieces,
    orderedPerSize,
    cutPerSize,
  };
}

// ─── Accessories ─────────────────────────────────────────────────────────────

const roundUp = (value: number) => Math.ceil(roundNoise(value));

export interface AccessoryQuantity {
  perSize: Record<SizeLabel, number>;
  total: number;
}

/**
 * Accessory quantity = garments x (accessoryQty / garmentQty), rounded UP.
 * With "by size" the total is the sum of the per-size (rounded) quantities; otherwise the
 * rounding is applied once to the grand total.
 */
export function calculateAccessory(
  accessory: Pick<AccessoryLine, 'accessoryQty' | 'garmentQty' | 'basis' | 'bySize'>,
  totals: Pick<WorkOrderTotals, 'orderedPerSize' | 'cutPerSize'>,
  sizes: readonly SizeLabel[],
): AccessoryQuantity {
  const valid = accessory.accessoryQty > 0 && accessory.garmentQty > 0;
  const rate = valid ? accessory.accessoryQty / accessory.garmentQty : 0;
  const source = accessory.basis === 'CUT' ? totals.cutPerSize : totals.orderedPerSize;
  const perSize: Record<SizeLabel, number> = {};
  for (const size of sizes) perSize[size] = roundUp((source[size] ?? 0) * rate);
  const total = accessory.bySize
    ? sizes.reduce((sum, size) => sum + perSize[size], 0)
    : roundUp(sizes.reduce((sum, size) => sum + (source[size] ?? 0), 0) * rate);
  return { perSize, total };
}

// ─── Fabric requirements ─────────────────────────────────────────────────────

/** Color of a fabric for one color line: its own color, or the color name when left empty. */
export function fabricColorOf(color: Pick<ColorLine, 'name' | 'fabricColors'>, fabric: Pick<FabricSpec, 'id'>): string {
  return color.fabricColors?.[fabric.id]?.trim() || color.name.trim() || '—';
}

export interface FabricRequirement {
  fabric: FabricSpec;
  color: string;
  pieces: number;
  /** Fabric quantity in the fabric's own unit, rounded to 2 decimals. */
  quantity: number;
}

/** Fabric needed per fabric and fabric color: pieces to cut x consumption, grouped by color. */
export function fabricRequirements(
  order: Pick<WorkOrderInput, 'sizes' | 'colors' | 'fabrics'>,
): FabricRequirement[] {
  const groups = new Map<string, FabricRequirement>();
  for (const color of order.colors) {
    const { cutPieces } = planColor(color, order.sizes);
    for (const fabric of order.fabrics) {
      if (!((fabric.consumptionPerPiece ?? 0) > 0)) continue;
      const name = fabricColorOf(color, fabric);
      const key = `${fabric.id}|${name.toLowerCase()}`;
      const group = groups.get(key) ?? { fabric, color: name, pieces: 0, quantity: 0 };
      group.pieces += cutPieces;
      groups.set(key, group);
    }
  }
  for (const group of groups.values()) {
    group.quantity = Math.round(group.pieces * (group.fabric.consumptionPerPiece ?? 0) * 100) / 100;
  }
  return [...groups.values()];
}

// ─── Validation ──────────────────────────────────────────────────────────────

export type WorkOrderIssueCode =
  | 'REQUIRED'
  | 'SIZES_REQUIRED'
  | 'SIZE_DUPLICATE'
  | 'PO_REQUIRED'
  | 'PO_DUPLICATE'
  | 'PO_QUANTITY_INVALID'
  | 'PO_DELIVERY_BEFORE_START'
  | 'COLOR_REQUIRED'
  | 'COLOR_DUPLICATE'
  | 'RATIO_EMPTY'
  | 'QUANTITY_INVALID'
  | 'NOT_WHOLE_BAGS'
  | 'EXTRA_PERCENT_INVALID'
  | 'PO_TOTAL_MISMATCH'
  | 'FABRIC_NAME_REQUIRED'
  | 'ACCESSORY_NAME_REQUIRED'
  | 'ACCESSORY_RATIO_INVALID';

export interface WorkOrderIssue {
  code: WorkOrderIssueCode;
  /** Where the problem is, e.g. "workOrderNumber", "pos.<id>.quantity", "colors.<id>.orderQuantity". */
  path: string;
  /** Numbers the screen needs to build the message (suggested quantities, totals...). */
  params?: Record<string, number | string>;
}

export function validateWorkOrder(order: WorkOrderInput): WorkOrderIssue[] {
  const issues: WorkOrderIssue[] = [];
  const add = (code: WorkOrderIssueCode, path: string, params?: WorkOrderIssue['params']) =>
    issues.push({ code, path, params });

  if (!order.workOrderNumber.trim()) add('REQUIRED', 'workOrderNumber');
  if (!order.client.trim()) add('REQUIRED', 'client');
  if (!order.modelName.trim()) add('REQUIRED', 'modelName');
  if (!order.clientStyle.trim()) add('REQUIRED', 'clientStyle');
  if (!order.ourStyle.trim()) add('REQUIRED', 'ourStyle');
  if (!order.startDate) add('REQUIRED', 'startDate');

  // Sizes
  const sizes = order.sizes.map((size) => size.trim());
  if (sizes.length === 0 || sizes.every((size) => size === '')) add('SIZES_REQUIRED', 'sizes');
  const seenSizes = new Set<string>();
  sizes.forEach((size, index) => {
    if (size === '') return;
    if (seenSizes.has(size.toLowerCase())) add('SIZE_DUPLICATE', `sizes.${index}`, { size });
    seenSizes.add(size.toLowerCase());
  });

  // PO lines: each has its own quantity and delivery date.
  if (order.pos.length === 0) add('PO_REQUIRED', 'pos');
  const seenPos = new Set<string>();
  for (const po of order.pos) {
    const key = po.poNumber.trim().toLowerCase();
    if (!key) add('REQUIRED', `pos.${po.id}.poNumber`);
    else if (seenPos.has(key)) add('PO_DUPLICATE', `pos.${po.id}.poNumber`, { poNumber: po.poNumber.trim() });
    seenPos.add(key);
    if (!(Number.isInteger(po.quantity) && po.quantity > 0)) add('PO_QUANTITY_INVALID', `pos.${po.id}.quantity`);
    if (!po.deliveryDate) add('REQUIRED', `pos.${po.id}.deliveryDate`);
    else if (order.startDate && po.deliveryDate < order.startDate)
      add('PO_DELIVERY_BEFORE_START', `pos.${po.id}.deliveryDate`);
  }

  // Colors
  if (order.colors.length === 0) add('COLOR_REQUIRED', 'colors');
  const seenColors = new Set<string>();
  for (const color of order.colors) {
    const name = color.name.trim().toLowerCase();
    if (!name) add('COLOR_REQUIRED', `colors.${color.id}.name`);
    else if (seenColors.has(name)) add('COLOR_DUPLICATE', `colors.${color.id}.name`, { color: color.name.trim() });
    seenColors.add(name);

    const plan = planColor(color, order.sizes);
    if (plan.bagSize === 0) add('RATIO_EMPTY', `colors.${color.id}.ratio`);
    if (!(Number.isInteger(color.orderQuantity) && color.orderQuantity > 0)) {
      add('QUANTITY_INVALID', `colors.${color.id}.orderQuantity`);
    } else if (plan.bagSize > 0 && !plan.isWholeBags) {
      add('NOT_WHOLE_BAGS', `colors.${color.id}.orderQuantity`, {
        bagSize: plan.bagSize,
        lower: plan.lowerQuantity,
        upper: plan.upperQuantity,
      });
    }
    if (!(Number.isFinite(color.extraPercent) && color.extraPercent >= 0 && color.extraPercent <= 100)) {
      add('EXTRA_PERCENT_INVALID', `colors.${color.id}.extraPercent`);
    }
  }

  // PO quantities and color quantities describe the same pieces, so they must agree.
  const totals = calculateWorkOrderTotals(order);
  if (order.pos.length > 0 && order.colors.length > 0 && totals.poDifference !== 0) {
    add('PO_TOTAL_MISMATCH', 'pos', { poPieces: totals.poPieces, orderedPieces: totals.orderedPieces });
    add('PO_TOTAL_MISMATCH', 'colors', { poPieces: totals.poPieces, orderedPieces: totals.orderedPieces });
  }

  for (const fabric of order.fabrics) {
    if (!fabric.name.trim()) add('FABRIC_NAME_REQUIRED', `fabrics.${fabric.id}.name`);
  }

  for (const accessory of order.accessories ?? []) {
    if (!accessory.name.trim()) add('ACCESSORY_NAME_REQUIRED', `accessories.${accessory.id}.name`);
    if (!(accessory.accessoryQty > 0 && accessory.garmentQty > 0)) {
      add('ACCESSORY_RATIO_INVALID', `accessories.${accessory.id}.ratio`);
    }
  }

  return issues;
}
