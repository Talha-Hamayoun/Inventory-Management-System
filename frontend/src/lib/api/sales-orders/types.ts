export type SalesOrderStatus = "PENDING" | "CONFIRMED" | "FULFILLED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";
export type PaymentMethod = "CASH" | "COD" | "JAZZCASH" | "EASYPAISA" | "BANK_TRANSFER" | "CARD" | "UPI" | "OTHER";
export type DiscountType = "FIXED" | "PERCENTAGE";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  COD: "Cash on Delivery (COD)",
  JAZZCASH: "JazzCash",
  EASYPAISA: "Easypaisa",
  BANK_TRANSFER: "Online Bank Transfer",
  CARD: "Card",
  UPI: "UPI / Digital Payment",
  OTHER: "Other",
};

export const POS_PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "OTHER", label: "Other" },
];

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
  discountType?: DiscountType | null;
  discountValue?: string;
  discountAmount?: string;
  paymentStatus: PaymentStatus;
  amountPaid: string;
  paymentMethod: PaymentMethod | null;
  amountReceived?: string | number | null;
  changeDue?: string | number | null;
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
