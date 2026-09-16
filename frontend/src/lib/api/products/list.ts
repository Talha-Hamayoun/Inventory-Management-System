import apiClient from "../client";
import type { ProductListResponse } from "./types";

export async function listProducts(params?: {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  status?: string;
}) {
  try {
    const response = await apiClient.get("/products", { params });
    return { data: response.data as ProductListResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
