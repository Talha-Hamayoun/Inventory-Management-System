import apiClient from "../client";
import type { CategoryMutationResponse } from "./types";

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
}

export async function updateCategory(id: string, data: UpdateCategoryRequest) {
  try {
    const response = await apiClient.put(`/categories/${id}`, data);
    return { data: response.data as CategoryMutationResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
