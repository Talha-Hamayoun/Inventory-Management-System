import type { PurchaseOrderDetailResponse, PurchaseOrderStatus } from "./types";
import apiClient from "../client";

export interface CreatePurchaseOrderRequest {
  supplierId: string;
  warehouseId: string;
  status?: PurchaseOrderStatus;
  expectedDeliveryDate?: string;
  items: {
    productId: string;
    orderedQuantity: number;
    unitCost: number;
  }[];
}

export async function createPurchaseOrder(data: CreatePurchaseOrderRequest) {
  try {
    const response = await apiClient.post("/purchase-orders", data);
    return { data: response.data as PurchaseOrderDetailResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
