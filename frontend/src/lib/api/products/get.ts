import apiClient from "../client";
import type { ProductDetailResponse } from "./types";

export async function getProduct(id: string) {
  try {
    const response = await apiClient.get(`/products/${id}`);
    return { data: response.data as ProductDetailResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
