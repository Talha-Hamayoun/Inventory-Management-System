import type { ReservationStatus, UpdateReservationResponse } from "./types";
import apiClient from "../client";

export interface UpdateReservationRequest {
  status: ReservationStatus;
}

export async function updateReservation(id: string, data: UpdateReservationRequest) {
  try {
    const response = await apiClient.put(`/reservations/${id}`, data);
    return { data: response.data as UpdateReservationResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
