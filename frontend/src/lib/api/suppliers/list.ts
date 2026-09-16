import apiClient from "../client";
import type { SupplierListResponse } from "./types";

export async function listSuppliers(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  try {
    const response = await apiClient.get("/suppliers", { params });
    return { data: response.data as SupplierListResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
