import apiClient from "../client";
import type { WarehouseDeleteResponse } from "./types";

export async function deleteWarehouse(id: string) {
  try {
    const response = await apiClient.delete(`/warehouses/${id}`);
    return { data: response.data as WarehouseDeleteResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
