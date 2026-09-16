import type { ReturnCondition, ReturnDetailResponse, ReturnType } from "./types";
import apiClient from "../client";

export interface CreateReturnRequest {
  returnType: ReturnType;
  salesOrderId?: string;
  purchaseOrderId?: string;
  warehouseId: string;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    condition: ReturnCondition;
  }[];
}

export async function createReturn(data: CreateReturnRequest) {
  try {
    const response = await apiClient.post("/returns", data);
    return { data: response.data as ReturnDetailResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
