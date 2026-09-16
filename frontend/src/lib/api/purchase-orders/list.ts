import type { ListPurchaseOrdersResponse, PurchaseOrderStatus } from "./types";
import apiClient from "../client";

export async function listPurchaseOrders(params?: {
  page?: number;
  limit?: number;
  search?: string;
  supplierId?: string;
  warehouseId?: string;
  status?: PurchaseOrderStatus;
}) {
  try {
    const response = await apiClient.get("/purchase-orders", { params });
    return { data: response.data as ListPurchaseOrdersResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
