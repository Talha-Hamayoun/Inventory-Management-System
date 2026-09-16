import apiClient from "../client";
import type { ProductMutationResponse } from "./types";

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  sku?: string;
  categoryId?: string;
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  unitOfMeasure?: string;
  barcode?: string;
}

export async function updateProduct(id: string, data: UpdateProductRequest) {
  try {
    const response = await apiClient.put(`/products/${id}`, data);
    return { data: response.data as ProductMutationResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
