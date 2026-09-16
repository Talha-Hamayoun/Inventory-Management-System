import type { ApiResponse } from "@/src/types/ApiResponse.d";

export type { ApiResponse };

export interface InventoryProduct {
  id: string;
  name: string;
  sku: string;
  unitOfMeasure?: string;
}

export interface InventoryWarehouse {
  id: string;
  name: string;
}

export interface InventoryUser {
  id: string;
  name: string;
}

export interface InventoryItem {
  id: string;
  itemNumber: string;
  productId: string;
  warehouseId: string;
  availableQuantity: number;
  reservedQuantity: number;
  damagedQuantity: number;
  minimumStockLevel: number;
  maximumStockLevel?: number | null;
  reorderPoint?: number | null;
  lastRestockedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  product: InventoryProduct;
  warehouse: InventoryWarehouse;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  warehouseId: string;
  type: "IN" | "OUT" | "ADJUST" | "TRANSFER" | "RETURN";
  quantity: number;
  referenceType: "PO" | "ORDER" | "MANUAL" | "TRANSFER" | "RETURN";
  referenceId?: string | null;
  notes?: string | null;
  performedBy: string;
  createdAt: string;
  product: InventoryProduct;
  warehouse: InventoryWarehouse;
  performedByUser: InventoryUser;
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type InventoryListResponse = ApiResponse<{
  data: InventoryItem[];
  pagination: PaginationData;
}>;

export type InventoryItemResponse = ApiResponse<{ data: InventoryItem }>;

export type InventoryMovementListResponse = ApiResponse<{
  data: InventoryMovement[];
  pagination: PaginationData;
}>;

export type InventoryMovementResponse = ApiResponse<{ data: InventoryMovement }>;

export type LowStockResponse = ApiResponse<{ data: InventoryItem[] }>;

export type InventoryDeleteResponse = ApiResponse<{ message: string }>;
