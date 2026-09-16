import type { SalesOrderDetailResponse } from "./types";
import apiClient from "../client";

export interface CreateSalesOrderRequest {
  customerId: string;
  warehouseId: string;
  notes?: string;
  items: { productId: string; quantity: number; unitPrice: number }[];
}

export async function createSalesOrder(data: CreateSalesOrderRequest) {
  try {
    const response = await apiClient.post("/sales-orders", data);
    return { data: response.data as SalesOrderDetailResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
