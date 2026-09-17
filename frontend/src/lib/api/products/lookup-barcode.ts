import type { ApiResponse } from "@/src/types/ApiResponse";
import apiClient from "../client";

export interface BarcodeLookupProduct {
  id: string;
  name: string;
  sku?: string | null;
  barcode: string | null;
  costPrice: number | null;
  sellingPrice: number | null;
  availableQuantity: number;
}

export type BarcodeLookupResponse = ApiResponse<{ data: BarcodeLookupProduct }>;

export async function lookupProductByBarcode(barcode: string, warehouseId: string) {
  try {
    const response = await apiClient.get("/products/lookup", {
      params: { barcode, warehouseId },
    });
    return { data: response.data as BarcodeLookupResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
