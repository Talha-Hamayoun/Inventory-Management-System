import apiClient from "../client";
import type { SupplierMutationResponse } from "./types";

export async function toggleSupplierStatus(id: string) {
  try {
    const response = await apiClient.patch(`/suppliers/${id}/toggle-status`);
    return { data: response.data as SupplierMutationResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
