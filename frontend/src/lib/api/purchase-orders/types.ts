export type PurchaseOrderStatus =
  | "DRAFT"
  | "ORDERED"
  | "PARTIALLY_RECEIVED"
  | "COMPLETED"
  | "CANCELLED";

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost: number;
  product: { id: string; name: string; sku: string | null };
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string | null;
  warehouseId: string | null;
  createdBy: string | null;
  status: PurchaseOrderStatus;
  expectedDeliveryDate: string | null;
  totalCost: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  supplier: { id: string; name: string } | null;
  warehouse: { id: string; name: string } | null;
  createdByUser: { id: string; name: string } | null;
  _count?: { items: number };
}

export interface PurchaseOrderDetail extends PurchaseOrder {
  items: PurchaseOrderItem[];
}

export type ListPurchaseOrdersResponse = {
  success: boolean;
  data: PurchaseOrder[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  message?: string;
};

export type PurchaseOrderDetailResponse = {
  success: boolean;
  data: PurchaseOrderDetail;
  message?: string;
};

export type CancelPurchaseOrderResponse = {
  success: boolean;
  message?: string;
  data?: unknown;
};
