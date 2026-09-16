export type ReservationStatus = "RESERVED" | "RELEASED" | "FULFILLED";

export interface Reservation {
  id: string;
  reservationNumber: string;
  orderId: number;
  productId: number;
  warehouseId: number;
  quantity: number;
  // orderId is a plain integer — a customer order reference number (not an encoded ID)
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
  product: { id: string; name: string; sku: string | null };
  warehouse: { id: string; name: string };
}

export type ListReservationsResponse = {
  success: boolean;
  data: Reservation[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  message?: string;
};

export type ReservationDetailResponse = {
  success: boolean;
  data: Reservation;
  message?: string;
};

export type UpdateReservationResponse = {
  success: boolean;
  data: Reservation;
  message?: string;
};

export type ReleaseByOrderResponse = {
  success: boolean;
  message: string;
  count?: number;
};
