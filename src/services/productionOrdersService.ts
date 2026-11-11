/**
 * Production orders service.
 *
 * Every export is async and returns plain data, so the UI never knows where the data
 * comes from. To connect a backend, replace the body of each function with a fetch:
 *
 *   getProductionOrders()      -> GET    /api/production/orders
 *   getProductionOrderById()   -> GET    /api/production/orders/:id
 *   getOrderHistory()          -> GET    /api/production/orders/:id/history
 *   createProductionOrder()    -> POST   /api/production/orders
 *   updateProductionOrder()    -> PUT    /api/production/orders/:id
 *   changeOrderStatus()        -> POST   /api/production/orders/:id/status
 *   getClients()               -> GET    /api/clients
 */
import { currentUser } from '../config/brand';
import { statusConfig } from '../config/statusConfig';
import { mockHistory, mockOrders } from '../data/mockOrders';
import type {
  ProductionHistoryEvent,
  ProductionOrder,
  ProductionOrderInput,
  ProductionStatus,
} from '../types/production';
import { getLineForStatus, isTransitionAllowed } from '../utils/workflow';
import { DuplicatePoNumberError, InvalidTransitionError, OrderNotFoundError } from './errors';

const SIMULATED_LATENCY_MS = 350;

// In-memory store that stands in for the database during the mock phase.
let orders: ProductionOrder[] = structuredClone(mockOrders);
const history: Record<string, ProductionHistoryEvent[]> = structuredClone(mockHistory);
let nextOrderNumber = orders.length + 1;
let nextEventNumber = 1;

function respond<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(value)), SIMULATED_LATENCY_MS);
  });
}

function reject(error: Error): Promise<never> {
  return new Promise((_, rejectPromise) => {
    setTimeout(() => rejectPromise(error), SIMULATED_LATENCY_MS);
  });
}

function nowLocalIso(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:00`;
}

function recordEvent(orderId: string, action: string, note?: string): void {
  nextEventNumber += 1;
  const event: ProductionHistoryEvent = {
    id: `${orderId}-new-${nextEventNumber}`,
    orderId,
    timestamp: nowLocalIso(),
    action,
    user: currentUser.name,
    note,
  };
  history[orderId] = [...(history[orderId] ?? []), event];
}

function isPoTaken(poNumber: string, excludeId?: string): boolean {
  const normalized = poNumber.trim().toLowerCase();
  return orders.some((order) => order.id !== excludeId && order.poNumber.toLowerCase() === normalized);
}

export function getProductionOrders(): Promise<ProductionOrder[]> {
  return respond(orders);
}

export function getProductionOrderById(id: string): Promise<ProductionOrder> {
  const order = orders.find((candidate) => candidate.id === id);
  return order ? respond(order) : reject(new OrderNotFoundError(id));
}

export function getOrderHistory(id: string): Promise<ProductionHistoryEvent[]> {
  const events = [...(history[id] ?? [])].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return respond(events);
}

export function getClients(): Promise<string[]> {
  return respond([...new Set(orders.map((order) => order.client))].sort((a, b) => a.localeCompare(b)));
}

export function createProductionOrder(input: ProductionOrderInput): Promise<ProductionOrder> {
  if (isPoTaken(input.poNumber)) return reject(new DuplicatePoNumberError(input.poNumber));

  const order: ProductionOrder = {
    ...input,
    id: String(nextOrderNumber),
    status: 'PENDING',
    progress: statusConfig.PENDING.progress,
  };
  nextOrderNumber += 1;
  orders = [order, ...orders];
  recordEvent(order.id, 'Order Created', 'Order entered manually.');
  return respond(order);
}

export function updateProductionOrder(
  id: string,
  input: ProductionOrderInput,
): Promise<ProductionOrder> {
  const existing = orders.find((order) => order.id === id);
  if (!existing) return reject(new OrderNotFoundError(id));
  if (isPoTaken(input.poNumber, id)) return reject(new DuplicatePoNumberError(input.poNumber));

  const updated: ProductionOrder = { ...existing, ...input };
  orders = orders.map((order) => (order.id === id ? updated : order));
  recordEvent(id, 'Order Edited');
  return respond(updated);
}

export function changeOrderStatus(
  id: string,
  status: ProductionStatus,
  note?: string,
): Promise<ProductionOrder> {
  const existing = orders.find((order) => order.id === id);
  if (!existing) return reject(new OrderNotFoundError(id));
  if (!isTransitionAllowed(existing.status, status)) {
    return reject(new InvalidTransitionError(statusConfig[existing.status].label, statusConfig[status].label));
  }

  const updated: ProductionOrder = {
    ...existing,
    status,
    progress: statusConfig[status].progress,
    assignedLine: getLineForStatus(status) ?? existing.assignedLine,
  };
  orders = orders.map((order) => (order.id === id ? updated : order));
  recordEvent(
    id,
    `Status changed to ${statusConfig[status].label}`,
    note?.trim() || `Moved from ${statusConfig[existing.status].label}.`,
  );
  return respond(updated);
}
