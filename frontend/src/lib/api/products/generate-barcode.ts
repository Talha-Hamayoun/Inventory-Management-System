import apiClient from "../client";
import type { ApiResponse } from "@/src/types/ApiResponse";

export interface GeneratedBarcode {
  id: string;
  name: string;
  sku?: string | null;
  barcode: string;
}

export type GenerateBarcodeResponse = ApiResponse<{
  data: GeneratedBarcode;
  generated: boolean;
}>;

export async function generateProductBarcode(id: string) {
  try {
    const response = await apiClient.post(`/products/${id}/barcode`);
    return { data: response.data as GenerateBarcodeResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
