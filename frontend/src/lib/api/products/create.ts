import apiClient from "../client";
import type { ProductMutationResponse } from "./types";

export interface CreateProductRequest {
  name: string;
  description?: string;
  sku: string;
  categoryId: string;
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  unitOfMeasure: string;
  barcode?: string;
}

export async function createProduct(data: CreateProductRequest) {
  try {
    const response = await apiClient.post("/products", data);
    return { data: response.data as ProductMutationResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
