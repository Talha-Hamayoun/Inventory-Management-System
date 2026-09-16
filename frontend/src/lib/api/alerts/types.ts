export type AlertType = "LOW_STOCK" | "OUT_OF_STOCK";

export interface StockAlert {
  id: string;
  productId: number;
  warehouseId: number;
  alertType: AlertType;
  threshold: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  product: { id: string; name: string; sku: string | null };
  warehouse: { id: string; name: string };
}

export interface TriggeredAlert extends StockAlert {
  currentStock: number;
}

export type ListAlertsResponse = {
  success: boolean;
  data: StockAlert[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  message?: string;
};

export type AlertDetailResponse = {
  success: boolean;
  data: StockAlert;
  message?: string;
};

export type TriggeredAlertsResponse = {
  success: boolean;
  data: TriggeredAlert[];
  message?: string;
};
