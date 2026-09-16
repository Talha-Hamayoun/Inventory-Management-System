import apiClient from "../client";
import type { CategoryDetailResponse } from "./types";

export async function getCategory(id: string) {
  try {
    const response = await apiClient.get(`/categories/${id}`);
    return { data: response.data as CategoryDetailResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
