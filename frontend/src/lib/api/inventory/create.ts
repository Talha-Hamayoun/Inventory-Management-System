import apiClient from "../client";
import type { InventoryItemResponse } from "./types";

export interface CreateInventoryRequest {
  productId: string;
  warehouseId: string;
  availableQuantity?: number;
  reservedQuantity?: number;
  damagedQuantity?: number;
  minimumStockLevel?: number;
  maximumStockLevel?: number;
  reorderPoint?: number;
  lastRestockedAt?: string;
}

export async function createInventoryItem(data: CreateInventoryRequest) {
  try {
    const response = await apiClient.post("/inventory", data);
    return { data: response.data as InventoryItemResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
