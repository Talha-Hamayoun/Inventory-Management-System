import type { ApiResponse } from "@/src/types/ApiResponse";

// ── Entity types (match backend response shapes exactly) ──────────────────────

export type ProductStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type UnitOfMeasure = "PCS" | "KG" | "LITERS" | "METERS" | "BOXES";

export interface Category {
  id: string;
  name: string;
}

export interface ProductInventoryItem {
  id: string;
  availableQuantity: number;
  reservedQuantity: number;
  damagedQuantity: number;
  minimumStockLevel: number;
  warehouse: { id: string; name: string };
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Shape returned by list  (GET /products) */
export interface ProductListItem {
  id: string;
  productNumber: string;
  name: string;
  sku?: string;
  status: ProductStatus;
  category?: { name: string } | null;
  costPrice?: string | null;
  sellingPrice?: string | null;
  createdAt: string;
}

/** Shape returned by detail (GET /products/:id) */
export interface ProductDetail {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  categoryId?: string | null;
  status: ProductStatus;
  unitOfMeasure: UnitOfMeasure;
  barcode?: string;
  costPrice?: string | null;
  sellingPrice?: string | null;
  createdAt: string;
  updatedAt: string;
  category?: Category | null;
  inventoryItems?: ProductInventoryItem[];
}

// ── API response types ────────────────────────────────────────────────────────

export type ProductListResponse = ApiResponse<{
  data: ProductListItem[];
  pagination: PaginationData;
}>;

export type ProductDetailResponse = ApiResponse<{ product: ProductDetail }>;

export type ProductMutationResponse = ApiResponse<{ data: ProductDetail }>;

export type ProductDeleteResponse = ApiResponse<{ message?: string }>;
