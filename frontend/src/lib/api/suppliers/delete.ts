import apiClient from "../client";
import type { SupplierDeleteResponse } from "./types";

export async function deleteSupplier(id: string) {
  try {
    const response = await apiClient.delete(`/suppliers/${id}`);
    return { data: response.data as SupplierDeleteResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
