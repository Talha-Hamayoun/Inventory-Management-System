import apiClient from "../client";
import type { InventoryMovementListResponse } from "./types";

export async function listMovements(params?: {
  page?: number;
  limit?: number;
  search?: string;
  warehouseId?: string;
  productId?: string;
  type?: "IN" | "OUT" | "ADJUST" | "TRANSFER" | "RETURN";
  startDate?: string;
  endDate?: string;
}) {
  try {
    const response = await apiClient.get("/inventory/movements/list", { params });
    return { data: response.data as InventoryMovementListResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
