import type { ApiResponse } from "@/src/types/ApiResponse";

// ── Entity types (match backend response shapes exactly) ──────────────────────

export interface CategoryParent {
  id: string;
  name: string;
}

/** Recursive tree node returned by GET /categories/tree */
export interface CategoryNode {
  id: string;
  name: string;
  description?: string;
  children?: CategoryNode[];
}

/** Full category shape returned by list / get / mutation endpoints */
export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  parent?: CategoryParent | null;
  children?: CategoryParent[];
  isActive?: boolean;
  _count?: { products: number; children: number };
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ── API response types ────────────────────────────────────────────────────────

export type CategoryListResponse = ApiResponse<{
  data: Category[];
  pagination: PaginationData;
}>;

export type CategoryDetailResponse = ApiResponse<{ data: Category }>;

export type CategoryMutationResponse = ApiResponse<{ data: Category }>;

export type CategoryDeleteResponse = ApiResponse<{ message: string }>;

export type CategoryTreeResponse = ApiResponse<{ data: CategoryNode[] }>;
