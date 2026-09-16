import type { ReservationDetailResponse } from "./types";
import apiClient from "../client";

export interface CreateReservationRequest {
  orderId: number;
  productId: string;
  warehouseId: string;
  quantity: number;
}

export async function createReservation(data: CreateReservationRequest) {
  try {
    const response = await apiClient.post("/reservations", data);
    return { data: response.data as ReservationDetailResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
