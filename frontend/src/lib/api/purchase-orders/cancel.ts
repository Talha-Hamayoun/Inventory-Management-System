import type { CancelPurchaseOrderResponse } from "./types";
import apiClient from "../client";

export async function cancelPurchaseOrder(id: string) {
  try {
    const response = await apiClient.post(`/purchase-orders/${id}/cancel`);
    return { data: response.data as CancelPurchaseOrderResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
