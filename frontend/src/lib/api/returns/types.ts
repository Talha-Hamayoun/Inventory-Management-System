export type ReturnType = "SALES_RETURN" | "PURCHASE_RETURN";
export type ReturnStatus = "PENDING" | "PROCESSED" | "CANCELLED";
export type ReturnCondition = "RESTOCKABLE" | "DAMAGED";

export interface ReturnItem {
  id: string;
  returnOrderId: string;
  productId: string;
  quantity: number;
  condition: ReturnCondition;
  unitPrice: number;
  unitCost: number | null;
  product: { id: string; name: string; sku: string | null };
}

export interface ReturnOrder {
  id: string;
  returnNumber: string;
  returnType: ReturnType;
  status: ReturnStatus;
  salesOrderId: string | null;
  customerId: string | null;
  purchaseOrderId: string | null;
  supplierId: string | null;
  warehouseId: string;
  notes: string | null;
  processedBy: string;
  createdAt: string;
  updatedAt: string;
  items: ReturnItem[];
  warehouse: { id: string; name: string };
  salesOrder: { id: string; orderNumber: string } | null;
  purchaseOrder: { id: string; poNumber: string } | null;
  supplier: { id: string; name: string } | null;
  processedByUser: { id: string; name: string };
}

export interface ReturnStats {
  total: number;
  recent: number;
  byType: { salesReturn: number; purchaseReturn: number };
  byStatus: { pending: number; processed: number; cancelled: number };
}

export type ListReturnsResponse = {
  success: boolean;
  data: ReturnOrder[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  message?: string;
};

export type ReturnDetailResponse = {
  success: boolean;
  data: ReturnOrder;
  message?: string;
};

export type ReturnStatsResponse = {
  success: boolean;
  data: ReturnStats;
  message?: string;
};
