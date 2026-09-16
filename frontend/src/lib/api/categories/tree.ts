import apiClient from "../client";
import type { CategoryTreeResponse } from "./types";

export async function getCategoryTree() {
  try {
    const response = await apiClient.get("/categories/tree");
    return { data: response.data as CategoryTreeResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
