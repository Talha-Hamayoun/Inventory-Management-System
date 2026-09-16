import type { ReservationDetailResponse } from "./types";
import apiClient from "../client";

export async function getReservation(id: string) {
  try {
    const response = await apiClient.get(`/reservations/${id}`);
    return { data: response.data as ReservationDetailResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
