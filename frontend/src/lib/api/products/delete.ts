import apiClient from "../client";
import type { ProductDeleteResponse } from "./types";

export async function deleteProduct(id: string) {
  try {
    const response = await apiClient.delete(`/products/${id}`);
    return { data: response.data as ProductDeleteResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
