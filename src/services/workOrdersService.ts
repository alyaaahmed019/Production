/**
 * Work orders service (Customer Service screens).
 *
 * Every save goes to the device first (IndexedDB) and adds an entry to the outbox in the SAME
 * transaction. A later sync step reads the outbox and sends the orders to Google Sheets, so the
 * screens never wait for the internet. The function signatures stay the same when sync is added.
 */
import { currentUser } from '../config/brand';
import type {
  WorkOrder,
  WorkOrderInput,
  WorkOrderListItem,
} from '../types/workOrder';
import { validateWorkOrder } from '../utils/workOrderCalc';
import {
  DuplicateWorkOrderNumberError,
  PoInOtherWorkOrderError,
  WorkOrderNotFoundError,
  WorkOrderValidationError,
} from './errors';
import { dbGet, dbGetAll, dbWrite, newId, type OutboxEntry } from './localDb';

const outboxKey = (orderId: string) => `work-order:${orderId}`;

function normalize(input: WorkOrderInput): WorkOrderInput {
  const sizes = input.sizes.map((size) => size.trim()).filter((size) => size !== '');
  return {
    ...input,
    workOrderNumber: input.workOrderNumber.trim(),
    client: input.client.trim(),
    garmentType: input.garmentType.trim(),
    modelName: input.modelName.trim(),
    clientStyle: input.clientStyle.trim(),
    ourStyle: input.ourStyle.trim(),
    notes: input.notes.trim(),
    sizes,
    pos: input.pos.map((po) => ({ ...po, poNumber: po.poNumber.trim().toUpperCase() })),
    colors: input.colors.map((color) => ({ ...color, name: color.name.trim() })),
    fabrics: input.fabrics.map((fabric) => ({ ...fabric, name: fabric.name.trim() })),
    accessories: (input.accessories ?? []).map((accessory) => ({ ...accessory, name: accessory.name.trim() })),
  };
}

/** Checks the rules the whole data set must follow: valid fields, unique numbers. */
async function assertCanSave(input: WorkOrderInput, excludeId?: string): Promise<void> {
  const issues = validateWorkOrder(input);
  if (issues.length > 0) throw new WorkOrderValidationError(issues);

  const others = (await dbGetAll<WorkOrder>('workOrders')).filter((order) => order.id !== excludeId);
  const number = input.workOrderNumber.toLowerCase();
  if (others.some((order) => order.workOrderNumber.toLowerCase() === number)) {
    throw new DuplicateWorkOrderNumberError(input.workOrderNumber);
  }
  for (const po of input.pos) {
    const owner = others.find((order) => order.pos.some((other) => other.poNumber === po.poNumber));
    if (owner) throw new PoInOtherWorkOrderError(po.poNumber, owner.workOrderNumber);
  }
}

function queueEntry(orderId: string, existing?: OutboxEntry): OutboxEntry {
  return {
    id: outboxKey(orderId),
    kind: 'UPSERT_WORK_ORDER',
    orderId,
    queuedAt: new Date().toISOString(),
    attempts: existing?.attempts ?? 0,
  };
}

export async function listWorkOrders(): Promise<WorkOrderListItem[]> {
  const [orders, outbox] = await Promise.all([
    dbGetAll<WorkOrder>('workOrders'),
    dbGetAll<OutboxEntry>('outbox'),
  ]);
  const pending = new Set(outbox.map((entry) => entry.orderId));
  return orders
    .map<WorkOrderListItem>((order) => ({ ...order, syncStatus: pending.has(order.id) ? 'pending' : 'synced' }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getWorkOrder(id: string): Promise<WorkOrderListItem> {
  const [order, entry] = await Promise.all([
    dbGet<WorkOrder>('workOrders', id),
    dbGet<OutboxEntry>('outbox', outboxKey(id)),
  ]);
  if (!order) throw new WorkOrderNotFoundError(id);
  return { ...order, syncStatus: entry ? 'pending' : 'synced' };
}

export async function createWorkOrder(input: WorkOrderInput): Promise<WorkOrder> {
  const data = normalize(input);
  await assertCanSave(data);

  const now = new Date().toISOString();
  const order: WorkOrder = {
    ...data,
    id: newId(),
    createdAt: now,
    updatedAt: now,
    createdBy: currentUser.name,
    updatedBy: currentUser.name,
  };
  await dbWrite([
    { store: 'workOrders', put: order },
    { store: 'outbox', put: queueEntry(order.id) },
  ]);
  return order;
}

export async function updateWorkOrder(id: string, input: WorkOrderInput): Promise<WorkOrder> {
  const existing = await dbGet<WorkOrder>('workOrders', id);
  if (!existing) throw new WorkOrderNotFoundError(id);

  const data = normalize(input);
  await assertCanSave(data, id);

  const order: WorkOrder = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
    updatedBy: currentUser.name,
  };
  const previousEntry = await dbGet<OutboxEntry>('outbox', outboxKey(id));
  await dbWrite([
    { store: 'workOrders', put: order },
    { store: 'outbox', put: queueEntry(id, previousEntry) },
  ]);
  return order;
}

/** Orders saved on this device that Google Sheets has not received yet. */
export async function getPendingSyncCount(): Promise<number> {
  return (await dbGetAll<OutboxEntry>('outbox')).length;
}

export async function getWorkOrderClients(): Promise<string[]> {
  const orders = await dbGetAll<WorkOrder>('workOrders');
  return [...new Set(orders.map((order) => order.client))].sort((a, b) => a.localeCompare(b));
}
