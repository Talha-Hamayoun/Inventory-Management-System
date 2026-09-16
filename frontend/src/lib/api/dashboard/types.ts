export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export interface RecentSalesOrder {
  id: string;
  orderNumber: string;
  status: "PENDING" | "CONFIRMED" | "FULFILLED" | "CANCELLED";
  totalAmount: number;
  createdAt: string;
  customer: { id: string; name: string };
}

export interface LowStockItem {
  id: string;
  availableQuantity: number;
  minimumStockLevel: number;
  product: { id: string; name: string; sku: string | null };
  warehouse: { id: string; name: string };
}

export interface DashboardStats {
  totalProducts: number;
  totalCustomers: number;
  totalWarehouses: number;
  lowStockAlerts: number;
  pendingPurchaseOrders: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  salesOrdersByStatus: Record<string, number>;
  monthlyRevenue: MonthlyRevenue[];
  recentSalesOrders: RecentSalesOrder[];
  lowStockItems: LowStockItem[];
}

export type DashboardStatsResponse = {
  success: boolean;
  data: DashboardStats;
  message?: string;
};
