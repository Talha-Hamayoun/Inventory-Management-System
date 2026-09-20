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
  repaired?: boolean;
}>;

export async function generateProductBarcode(id: string, options?: { force?: boolean }) {
  try {
    const response = await apiClient.post(`/products/${id}/barcode`, null, {
      params: options?.force ? { force: true } : undefined,
    });
    return { data: response.data as GenerateBarcodeResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
