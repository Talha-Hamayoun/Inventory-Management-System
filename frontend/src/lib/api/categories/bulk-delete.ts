import apiClient from "../client";
import type { CategoryDeleteResponse } from "./types";

export async function bulkDeleteCategories(ids: string[]) {
  try {
    const response = await apiClient.delete("/categories/bulk", {
      data: { ids },
    });
    return {
      data: response.data as CategoryDeleteResponse,
      status: response.status,
    };
  } catch (error) {
    return { error };
  }
}
