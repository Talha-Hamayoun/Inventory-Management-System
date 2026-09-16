import apiClient from "../client";
import type { CategoryListResponse } from "./types";

export async function listCategories(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  try {
    const response = await apiClient.get("/categories", { params });
    return { data: response.data as CategoryListResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
