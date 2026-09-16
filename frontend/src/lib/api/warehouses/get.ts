import apiClient from "../client";
import type { WarehouseDetailResponse } from "./types";

export async function getWarehouse(id: string) {
  try {
    const response = await apiClient.get(`/warehouses/${id}`);
    return { data: response.data as WarehouseDetailResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
