import apiClient from "../client";
import type { InventoryItemResponse } from "./types";

export async function getInventoryItem(id: string) {
  try {
    const response = await apiClient.get(`/inventory/${id}`);
    return { data: response.data as InventoryItemResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
