import type { ApiResponse } from "@/src/types/ApiResponse";

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SupplierCount {
  purchaseOrders: number;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  paymentTerms?: string | null;
  leadTimeDays?: number | null;
  notes?: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: SupplierCount;
}

export interface SupplierPurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  totalCost: string;
  createdAt: string;
}

export interface SupplierDetail extends Supplier {
  purchaseOrders?: SupplierPurchaseOrder[];
}

export type SupplierListResponse = ApiResponse<{
  data: Supplier[];
  pagination: PaginationData;
}>;

export type SupplierDetailResponse = ApiResponse<{ data: SupplierDetail }>;
export type SupplierMutationResponse = ApiResponse<{ data: Supplier }>;
export type SupplierDeleteResponse = ApiResponse<{ message: string }>;
