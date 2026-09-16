import apiClient from "../client";
import type { WarehouseMutationResponse } from "./types";

export async function toggleWarehouseStatus(id: string) {
  try {
    const response = await apiClient.patch(`/warehouses/${id}/toggle-status`);
    return { data: response.data as WarehouseMutationResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
