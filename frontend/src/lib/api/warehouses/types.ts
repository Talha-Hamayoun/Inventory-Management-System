import type { ApiResponse } from "@/src/types/ApiResponse";

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface WarehouseCount {
  inventoryItems: number;
  purchaseOrders: number;
}

export interface WarehouseInventorySummary {
  totalAvailable: number;
  totalReserved: number;
  totalDamaged: number;
}

export interface Warehouse {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: WarehouseCount;
}

export interface WarehouseDetail extends Warehouse {
  inventorySummary?: WarehouseInventorySummary;
}

export type WarehouseListResponse = ApiResponse<{
  data: Warehouse[];
  pagination: PaginationData;
}>;

export type WarehouseDetailResponse = ApiResponse<{ data: WarehouseDetail }>;
export type WarehouseMutationResponse = ApiResponse<{ data: Warehouse }>;
export type WarehouseDeleteResponse = ApiResponse<{ message: string }>;
