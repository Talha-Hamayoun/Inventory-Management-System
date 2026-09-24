import apiClient from "../client";
import type { PaymentMethod } from "./types";

export interface AddSalesOrderItemsRequest {
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  amountPaid?: number;
  paymentMethod?: PaymentMethod;
  amountReceived?: number;
  changeDue?: number;
}

export async function addSalesOrderItems(id: string, data: AddSalesOrderItemsRequest) {
  try {
    const response = await apiClient.post(`/sales-orders/${id}/items`, data);
    return { data: response.data, status: response.status };
  } catch (error) {
    return { error };
  }
}
