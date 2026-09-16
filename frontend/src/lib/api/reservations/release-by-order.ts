import type { ReleaseByOrderResponse } from "./types";
import apiClient from "../client";

export async function releaseByOrder(orderId: string) {
  try {
    const response = await apiClient.post(`/reservations/release-by-order/${orderId}`);
    return { data: response.data as ReleaseByOrderResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
