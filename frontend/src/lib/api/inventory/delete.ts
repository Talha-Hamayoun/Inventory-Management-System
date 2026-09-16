import apiClient from "../client";
import type { InventoryDeleteResponse } from "./types";

export async function deleteInventoryItem(id: string) {
  try {
    const response = await apiClient.delete(`/inventory/${id}`);
    return { data: response.data as InventoryDeleteResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
