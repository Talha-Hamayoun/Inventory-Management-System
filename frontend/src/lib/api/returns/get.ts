import type { ReturnDetailResponse } from "./types";
import apiClient from "../client";

export async function getReturn(id: string) {
  try {
    const response = await apiClient.get(`/returns/${id}`);
    return { data: response.data as ReturnDetailResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
