import apiClient from "../client";
import type { InventoryMovementResponse } from "./types";

export interface CreateMovementRequest {
  productId: string;
  warehouseId: string;
  type: "IN" | "OUT" | "ADJUST" | "TRANSFER" | "RETURN";
  quantity: number;
  referenceType: "PO" | "ORDER" | "MANUAL" | "TRANSFER" | "RETURN";
  referenceId?: string;
  notes?: string;
  fromWarehouseId?: string;
  toWarehouseId?: string;
}

export async function createMovement(data: CreateMovementRequest) {
  try {
    const response = await apiClient.post("/inventory/movements", data);
    return { data: response.data as InventoryMovementResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
