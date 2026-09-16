import type { ListReservationsResponse, ReservationStatus } from "./types";
import apiClient from "../client";

export async function listReservations(params?: {
  page?: number;
  limit?: number;
  orderId?: string;
  status?: ReservationStatus;
  warehouseId?: string;
}) {
  try {
    const response = await apiClient.get("/reservations", { params });
    return { data: response.data as ListReservationsResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
