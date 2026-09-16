import apiClient from "../client";
import type { SupplierDetailResponse } from "./types";

export async function getSupplier(id: string) {
  try {
    const response = await apiClient.get(`/suppliers/${id}`);
    return { data: response.data as SupplierDetailResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
