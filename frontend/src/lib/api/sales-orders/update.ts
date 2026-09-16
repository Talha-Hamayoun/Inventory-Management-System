import type { SalesOrderDetailResponse } from "./types";
import apiClient from "../client";

export interface UpdateSalesOrderRequest {
  customerId?: string;
  warehouseId?: string;
  notes?: string;
  items?: { productId: string; quantity: number; unitPrice: number }[];
}

export async function updateSalesOrder(id: string, data: UpdateSalesOrderRequest) {
  try {
    const response = await apiClient.put(`/sales-orders/${id}`, data);
    return { data: response.data as SalesOrderDetailResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
