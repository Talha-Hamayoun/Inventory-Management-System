import apiClient from "../client";
import type { PaymentMethod } from "./types";

export interface UpdatePaymentRequest {
  amountPaid: number;
  paymentMethod?: PaymentMethod;
}

export async function updatePayment(id: string, data: UpdatePaymentRequest) {
  try {
    const response = await apiClient.patch(`/sales-orders/${id}/payment`, data);
    return { data: response.data, status: response.status };
  } catch (error) {
    return { error };
  }
}
