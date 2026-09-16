import apiClient from "../client";
import type { InventoryListResponse } from "./types";

export async function listInventory(params?: {
  page?: number;
  limit?: number;
  search?: string;
  warehouseId?: string;
  productId?: string;
  lowStock?: boolean;
}) {
  try {
    const response = await apiClient.get("/inventory", { params });
    return { data: response.data as InventoryListResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
