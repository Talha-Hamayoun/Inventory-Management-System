import type { PurchaseOrderDetailResponse } from "./types";
import apiClient from "../client";

export async function getPurchaseOrder(id: string) {
  try {
    const response = await apiClient.get(`/purchase-orders/${id}`);
    return { data: response.data as PurchaseOrderDetailResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
