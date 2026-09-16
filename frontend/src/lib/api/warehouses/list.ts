import apiClient from "../client";
import type { WarehouseListResponse } from "./types";

export async function listWarehouses(params?: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}) {
  try {
    const response = await apiClient.get("/warehouses", { params });
    return { data: response.data as WarehouseListResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
