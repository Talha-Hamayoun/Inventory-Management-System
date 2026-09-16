import apiClient from "../client";
import type { WarehouseMutationResponse } from "./types";

export interface UpdateWarehouseRequest {
  name?: string;
  address?: string;
  isActive?: boolean;
}

export async function updateWarehouse(id: string, data: UpdateWarehouseRequest) {
  try {
    const response = await apiClient.put(`/warehouses/${id}`, data);
    return { data: response.data as WarehouseMutationResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
