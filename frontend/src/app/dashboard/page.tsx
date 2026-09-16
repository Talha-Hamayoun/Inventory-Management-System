"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/src/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card";
import { Loading } from "@/src/components/ui/loading";
import { Badge } from "@/src/components/ui/badge";
import { dashboardApi } from "@/src/lib/api";
import type { DashboardStats } from "@/src/lib/api/dashboard/types";
import { formatDateTime } from "@/src/lib/utils";
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  FULFILLED: "#10b981",
  CANCELLED: "#ef4444",
};

const STATUS_VARIANTS: Record<string, "default" | "info" | "success" | "error"> = {
  PENDING: "default",
  CONFIRMED: "info",
  FULFILLED: "success",
  CANCELLED: "error",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    // currency: "USD",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function RevenueChange({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <span className="text-xs text-gray-400">No data yet</span>;
  if (previous === 0) return <span className="text-xs text-green-600 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> New this month</span>;
  const pct = ((current - previous) / previous) * 100;
  const up = pct >= 0;
  return (
    <span className={`text-xs flex items-center gap-1 ${up ? "text-green-600" : "text-red-500"}`}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(pct).toFixed(1)}% vs last month
    </span>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    dashboardApi.stats().then((res) => {
      if (res.data?.success) setStats(res.data.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loading size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!stats) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96 text-gray-500">
          Failed to load dashboard data.
        </div>
      </DashboardLayout>
    );
  }

  const pieData = Object.entries(stats.salesOrdersByStatus)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">Overview of your inventory and sales</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Revenue this month */}
          <Card className="xl:col-span-2">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Revenue This Month</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(stats.revenueThisMonth)}</p>
                  <div className="mt-1">
                    <RevenueChange current={stats.revenueThisMonth} previous={stats.revenueLastMonth} />
                  </div>
                </div>
                <div className="h-11 w-11 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  {/* <DollarSign className="h-5 w-5 text-green-600" /> */}
                  <span className="h-5 w-5 text-green-600">Rs</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Products */}
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Products</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalProducts}</p>
                  <p className="text-xs text-gray-400 mt-1">Active products</p>
                </div>
                <div className="h-11 w-11 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customers */}
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Customers</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalCustomers}</p>
                  <p className="text-xs text-gray-400 mt-1">Active customers</p>
                </div>
                <div className="h-11 w-11 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Low Stock</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.lowStockAlerts}</p>
                  <p className="text-xs text-gray-400 mt-1">Active alerts</p>
                </div>
                <div className="h-11 w-11 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending PO */}
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending POs</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingPurchaseOrders}</p>
                  <p className="text-xs text-gray-400 mt-1">Purchase orders</p>
                </div>
                <div className="h-11 w-11 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
                  <ShoppingCart className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Revenue Bar Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-gray-500" />
                Monthly Revenue (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.monthlyRevenue.every((m) => m.revenue === 0) ? (
                <div className="flex items-center justify-center h-56 text-gray-400 text-sm">
                  No fulfilled sales orders yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={224}>
                  <BarChart data={stats.monthlyRevenue} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      tickFormatter={(v: string) => v.split(" ")[0]}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                      width={48}
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value ?? 0)), "Revenue"]}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Sales Order Status Pie */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="h-4 w-4 text-gray-500" />
                Sales Orders by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length === 0 ? (
                <div className="flex items-center justify-center h-56 text-gray-400 text-sm">
                  No sales orders yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={224}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#94a3b8"} />
                      ))}
                    </Pie>
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string) => (
                        <span style={{ fontSize: 11, color: "#374151" }}>
                          {value} ({stats.salesOrdersByStatus[value] ?? 0})
                        </span>
                      )}
                    />
                    <Tooltip
                      formatter={(value, name) => [Number(value ?? 0), String(name ?? "")]}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sales Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Sales Orders</CardTitle>
                <Link href="/sales-orders" className="text-xs text-blue-600 hover:underline">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {stats.recentSalesOrders.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No sales orders yet</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentSalesOrders.map((order) => (
                    <Link href={`/sales-orders/${order.id}`} key={order.id}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="font-mono text-sm font-semibold text-gray-900">{order.orderNumber}</p>
                          <p className="text-xs text-gray-500">{order.customer.name} · {formatDateTime(order.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={(STATUS_VARIANTS[order.status] ?? "default") as "default" | "info" | "success" | "error" | "warning"}>
                            {order.status}
                          </Badge>
                          <span className="text-sm font-semibold text-gray-800 tabular-nums">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Low Stock Items</CardTitle>
                <Link href="/alerts" className="text-xs text-blue-600 hover:underline">
                  View alerts
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {stats.lowStockItems.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">All stock levels are healthy</p>
              ) : (
                <div className="space-y-3">
                  {stats.lowStockItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.product.name}</p>
                        <p className="text-xs text-gray-500">
                          {item.product.sku ? `SKU: ${item.product.sku} · ` : ""}
                          {item.warehouse.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                          <span className="text-lg font-bold text-red-600">{item.availableQuantity}</span>
                        </div>
                        <p className="text-xs text-gray-400">Min: {item.minimumStockLevel}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                href="/products/new"
                className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-colors"
              >
                <Package className="h-7 w-7 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Add Product</span>
              </Link>
              <Link
                href="/sales-orders/new"
                className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-green-50 hover:border-green-200 border border-transparent transition-colors"
              >
                <ClipboardList className="h-7 w-7 text-green-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">New Sales Order</span>
              </Link>
              <Link
                href="/purchase-orders/new"
                className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-yellow-50 hover:border-yellow-200 border border-transparent transition-colors"
              >
                <ShoppingCart className="h-7 w-7 text-yellow-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Purchase Order</span>
              </Link>
              <Link
                href="/alerts"
                className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-red-50 hover:border-red-200 border border-transparent transition-colors"
              >
                <AlertTriangle className="h-7 w-7 text-red-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">View Alerts</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
