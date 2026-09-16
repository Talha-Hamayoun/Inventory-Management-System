import apiClient from "../client";
import type { WarehouseMutationResponse } from "./types";

export interface CreateWarehouseRequest {
  name: string;
  address: string;
  isActive?: boolean;
}

export async function createWarehouse(data: CreateWarehouseRequest) {
  try {
    const response = await apiClient.post("/warehouses", data);
    return { data: response.data as WarehouseMutationResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
