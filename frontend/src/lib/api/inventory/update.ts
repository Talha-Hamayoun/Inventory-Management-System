import apiClient from "../client";
import type { InventoryItemResponse } from "./types";

export interface UpdateInventoryRequest {
  availableQuantity?: number;
  reservedQuantity?: number;
  damagedQuantity?: number;
  minimumStockLevel?: number;
  maximumStockLevel?: number;
  reorderPoint?: number;
  lastRestockedAt?: string;
}

export async function updateInventoryItem(id: string, data: UpdateInventoryRequest) {
  try {
    const response = await apiClient.put(`/inventory/${id}`, data);
    return { data: response.data as InventoryItemResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
