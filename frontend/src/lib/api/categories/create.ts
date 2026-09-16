import apiClient from "../client";
import type { CategoryMutationResponse } from "./types";

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
}

export async function createCategory(data: CreateCategoryRequest) {
  try {
    const response = await apiClient.post("/categories", data);
    return { data: response.data as CategoryMutationResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
