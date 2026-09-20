import apiClient from "../client";
import type { DiscountType, PaymentMethod, SalesOrder } from "../sales-orders/types";

export interface PosProduct {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  sellingPrice?: string | null;
  costPrice?: string | null;
  status: string;
  availableQuantity: number;
  outOfStock: boolean;
  category?: { id: string; name: string } | null;
}

export interface PosCartItem {
  productId: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  unitPrice: number;
  quantity: number;
  availableQuantity: number;
  categoryName?: string | null;
}

export interface PosHeldSale {
  id: string;
  label: string | null;
  warehouseId: string;
  customerId: string | null;
  cartData: {
    items: PosCartItem[];
    discountType?: DiscountType | null;
    discountValue?: number;
  };
  createdAt: string;
  updatedAt: string;
  warehouse?: { id: string; name: string };
  customer?: { id: string; name: string; phone: string } | null;
}

export interface PosCheckoutRequest {
  customerId?: string;
  warehouseId: string;
  notes?: string;
  items: { productId: string; quantity: number; unitPrice: number }[];
  paymentMethod: PaymentMethod;
  amountPaid: number;
  amountReceived?: number;
  discountType?: DiscountType;
  discountValue?: number;
  heldSaleId?: string;
}

export type PosCheckoutResponse = {
  success: boolean;
  data?: SalesOrder & {
    amountReceived?: string | number | null;
    changeDue?: string | number | null;
    subtotal?: number;
    tax?: number;
  };
  message?: string;
};

export async function listPosProducts(params: {
  warehouseId: string;
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
}) {
  try {
    const response = await apiClient.get("/pos/products", { params });
    return {
      data: response.data as {
        success: boolean;
        data: PosProduct[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
        message?: string;
      },
      status: response.status,
    };
  } catch (error) {
    return { error };
  }
}

export async function getWalkInCustomer() {
  try {
    const response = await apiClient.get("/pos/walk-in-customer");
    return {
      data: response.data as {
        success: boolean;
        data: { id: string; name: string; phone: string; isWalkIn?: boolean };
        message?: string;
      },
      status: response.status,
    };
  } catch (error) {
    return { error };
  }
}

export async function posCheckout(body: PosCheckoutRequest) {
  try {
    const response = await apiClient.post("/pos/checkout", body);
    return { data: response.data as PosCheckoutResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}

export async function listHeldSales() {
  try {
    const response = await apiClient.get("/pos/held");
    return {
      data: response.data as { success: boolean; data: PosHeldSale[]; message?: string },
      status: response.status,
    };
  } catch (error) {
    return { error };
  }
}

export async function createHeldSale(body: {
  label?: string;
  warehouseId: string;
  customerId?: string | null;
  cartData: PosHeldSale["cartData"];
}) {
  try {
    const response = await apiClient.post("/pos/held", body);
    return {
      data: response.data as { success: boolean; data: PosHeldSale; message?: string },
      status: response.status,
    };
  } catch (error) {
    return { error };
  }
}

export async function deleteHeldSale(id: string) {
  try {
    const response = await apiClient.delete(`/pos/held/${id}`);
    return {
      data: response.data as { success: boolean; message?: string },
      status: response.status,
    };
  } catch (error) {
    return { error };
  }
}
