import type { PurchaseOrderDetailResponse } from "./types";
import apiClient from "../client";

export async function receivePurchaseOrder(
  id: string,
  items: { itemId: string; receivedQuantity: number }[]
) {
  try {
    const response = await apiClient.post(`/purchase-orders/${id}/receive`, { items });
    return { data: response.data as PurchaseOrderDetailResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
