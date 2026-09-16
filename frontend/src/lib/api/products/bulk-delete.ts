import apiClient from "../client";
import type { ProductDeleteResponse } from "./types";

export async function bulkDeleteProducts(ids: string[]) {
  try {
    const response = await apiClient.delete("/products/bulk", {
      data: { ids },
    });
    return {
      data: response.data as ProductDeleteResponse,
      status: response.status,
    };
  } catch (error) {
    return { error };
  }
}
