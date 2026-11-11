import {
  getClients,
  getOrderHistory,
  getProductionOrderById,
  getProductionOrders,
} from '../services/productionOrdersService';
import { useAsyncData } from './useAsyncData';

export function useProductionOrders() {
  return useAsyncData(getProductionOrders);
}

export function useOrderDetails(id: string) {
  return useAsyncData(
    async () => {
      const [order, history] = await Promise.all([getProductionOrderById(id), getOrderHistory(id)]);
      return { order, history };
    },
    [id],
  );
}

export function useClients() {
  return useAsyncData(getClients);
}
