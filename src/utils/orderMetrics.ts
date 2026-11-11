import type { OrderFilterValues, OrderSummary, ProductionOrder } from '../types/production';

export const EMPTY_FILTERS: OrderFilterValues = {
  search: '',
  client: '',
  status: '',
  color: '',
  dateFrom: '',
  dateTo: '',
};

export function getOrderSummary(orders: readonly ProductionOrder[]): OrderSummary {
  let pending = 0;
  let completed = 0;
  for (const order of orders) {
    if (order.status === 'PENDING') pending += 1;
    else if (order.status === 'COMPLETED') completed += 1;
  }
  return {
    total: orders.length,
    pending,
    completed,
    inProduction: orders.length - pending - completed,
  };
}

export function filterOrders(
  orders: readonly ProductionOrder[],
  filters: OrderFilterValues,
): ProductionOrder[] {
  const query = filters.search.trim().toLowerCase();
  return orders.filter((order) => {
    if (query) {
      const haystack = `${order.poNumber} ${order.client} ${order.product}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (filters.client && order.client !== filters.client) return false;
    if (filters.status && order.status !== filters.status) return false;
    if (filters.color && !order.colors.includes(filters.color)) return false;
    // ISO dates compare correctly as strings
    if (filters.dateFrom && order.orderDate < filters.dateFrom) return false;
    if (filters.dateTo && order.orderDate > filters.dateTo) return false;
    return true;
  });
}

/** Number of active filters, excluding the free-text search. */
export function countActiveFilters(filters: OrderFilterValues): number {
  return [filters.client, filters.status, filters.color, filters.dateFrom, filters.dateTo].filter(
    Boolean,
  ).length;
}

export function hasAnyFilter(filters: OrderFilterValues): boolean {
  return Boolean(filters.search.trim()) || countActiveFilters(filters) > 0;
}

export function getFilterOptions(orders: readonly ProductionOrder[]): {
  clients: string[];
  colors: string[];
} {
  const clients = new Set<string>();
  const colors = new Set<string>();
  for (const order of orders) {
    clients.add(order.client);
    order.colors.forEach((color) => colors.add(color));
  }
  return {
    clients: [...clients].sort((a, b) => a.localeCompare(b)),
    colors: [...colors].sort((a, b) => a.localeCompare(b)),
  };
}
