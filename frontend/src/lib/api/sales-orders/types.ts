export type SalesOrderStatus = "PENDING" | "CONFIRMED" | "FULFILLED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";
export type PaymentMethod = "CASH" | "COD" | "JAZZCASH" | "EASYPAISA" | "BANK_TRANSFER";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  COD: "Cash on Delivery (COD)",
  JAZZCASH: "JazzCash",
  EASYPAISA: "Easypaisa",
  BANK_TRANSFER: "Online Bank Transfer",
};

export interface SalesOrderItem {
  id: string;
  salesOrderId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  product: { id: string; name: string; sku: string | null };
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  warehouseId: string;
  status: SalesOrderStatus;
  notes: string | null;
  totalAmount: string;
  paymentStatus: PaymentStatus;
  amountPaid: string;
  paymentMethod: PaymentMethod | null;
  isDeleted: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; name: string; phone: string; email?: string; address?: string };
  warehouse: { id: string; name: string };
  createdByUser?: { id: string; name: string };
  items: SalesOrderItem[];
  itemCount?: number;
}

export type ListSalesOrdersResponse = {
  success: boolean;
  data: SalesOrder[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  message?: string;
};

export type SalesOrderDetailResponse = {
  success: boolean;
  data: SalesOrder;
  message?: string;
};
