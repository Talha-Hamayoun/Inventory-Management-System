import apiClient from "../client";
import type { CategoryDeleteResponse } from "./types";

export async function deleteCategory(id: string) {
  try {
    const response = await apiClient.delete(`/categories/${id}`);
    return { data: response.data as CategoryDeleteResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
