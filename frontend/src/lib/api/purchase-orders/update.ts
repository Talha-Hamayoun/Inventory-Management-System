import type { PurchaseOrderDetailResponse, PurchaseOrderStatus } from "./types";
import apiClient from "../client";

export interface UpdatePurchaseOrderRequest {
  status?: PurchaseOrderStatus;
  expectedDeliveryDate?: string;
}

export async function updatePurchaseOrder(id: string, data: UpdatePurchaseOrderRequest) {
  try {
    const response = await apiClient.put(`/purchase-orders/${id}`, data);
    return { data: response.data as PurchaseOrderDetailResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
