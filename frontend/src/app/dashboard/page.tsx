"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/src/components/dashboard-layout";
import { Loading } from "@/src/components/ui/loading";
import { Badge } from "@/src/components/ui/badge";
import { dashboardApi } from "@/src/lib/api";
import type { DashboardStats } from "@/src/lib/api/dashboard/types";
import { formatDateTime } from "@/src/lib/utils";
import { useTheme } from "@/src/lib/theme-context";
import { StatCard } from "./_components/stat-card";
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  Users,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  ArrowUpRight,
  CheckCircle2,
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

const panelClass =
  "rounded-2xl border border-gray-200/70 bg-white/80 dark:bg-gray-50/80 backdrop-blur-xl shadow-sm";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function RevenueChange({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) {
    return <span className="text-gray-400">No data yet</span>;
  }
  if (previous === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-300">
        <TrendingUp className="h-3 w-3" />
        New this month
      </span>
    );
  }
  const pct = ((current - previous) / previous) * 100;
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 ${up ? "text-emerald-600 dark:text-emerald-300" : "text-rose-500"}`}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(pct).toFixed(1)}% vs last month
    </span>
  );
}

function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200/80 bg-white/95 dark:bg-gray-50/95 px-3 py-2 shadow-lg">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">
        {formatCurrency(Number(payload[0].value ?? 0))}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
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
        <div className={`${panelClass} flex items-center justify-center h-96 text-gray-500`}>
          Failed to load dashboard data.
        </div>
      </DashboardLayout>
    );
  }

  const pieData = Object.entries(stats.salesOrdersByStatus)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));
  const orderTotal = pieData.reduce((sum, item) => sum + item.value, 0);
  const axis = isDark ? "#94a3b8" : "#6b7280";
  const grid = isDark ? "rgba(148,163,184,0.18)" : "#eef2f7";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">Overview of your inventory and sales</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            className="xl:col-span-2"
            label="Revenue This Month"
            value={formatCurrency(stats.revenueThisMonth)}
            tone="emerald"
            iconNode={<span className="text-sm font-bold">Rs</span>}
            hint={<RevenueChange current={stats.revenueThisMonth} previous={stats.revenueLastMonth} />}
          />

          <StatCard
            label="Products"
            value={stats.totalProducts}
            hint="Active products"
            icon={Package}
            tone="blue"
          />

          <StatCard
            label="Customers"
            value={stats.totalCustomers}
            hint="Active customers"
            icon={Users}
            tone="violet"
          />

          <StatCard
            label="Low Stock"
            value={stats.lowStockAlerts}
            hint="Active alerts"
            icon={AlertTriangle}
            tone="rose"
          />

          <StatCard
            label="Pending POs"
            value={stats.pendingPurchaseOrders}
            hint="Purchase orders"
            icon={ShoppingCart}
            tone="amber"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`${panelClass} lg:col-span-2 p-5`}>
            <div className="flex items-center gap-2 mb-4">
              <span className="h-8 w-8 rounded-xl bg-blue-500/12 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-semibold text-gray-900">Monthly Revenue (Last 6 Months)</h3>
            </div>
            {stats.monthlyRevenue.every((m) => m.revenue === 0) ? (
              <div className="flex items-center justify-center h-56 text-gray-400 text-sm">
                No fulfilled sales orders yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={224}>
                <BarChart data={stats.monthlyRevenue} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#93c5fd" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: axis }}
                    tickFormatter={(v: string) => v.split(" ")[0]}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: axis }}
                    tickFormatter={(v: number) => `Rs ${(v / 1000).toFixed(0)}k`}
                    width={56}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<RevenueTooltip />} cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)" }} />
                  <Bar dataKey="revenue" fill="url(#revenueBar)" radius={[8, 8, 0, 0]} maxBarSize={42} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className={`${panelClass} p-5`}>
            <div className="flex items-center gap-2 mb-4">
              <span className="h-8 w-8 rounded-xl bg-violet-500/12 text-violet-600 dark:text-violet-300 flex items-center justify-center">
                <ClipboardList className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-semibold text-gray-900">Sales Orders by Status</h3>
            </div>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-56 text-gray-400 text-sm">
                No sales orders yet
              </div>
            ) : (
              <div>
                <div className="relative h-42">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={74}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#94a3b8"} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [Number(value ?? 0), String(name ?? "")]}
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 12,
                          border: "1px solid rgba(229,231,235,0.8)",
                          background: isDark ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.95)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">{orderTotal}</span>
                    <span className="text-[10px] uppercase tracking-wide text-gray-400">Orders</span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {pieData.map((entry) => (
                    <span
                      key={entry.name}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gray-100/80 dark:bg-white/6 px-2.5 py-1 text-[11px] font-medium text-gray-600"
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[entry.name] ?? "#94a3b8" }}
                      />
                      {entry.name} ({entry.value})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`${panelClass} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Recent Sales Orders</h3>
              <Link
                href="/sales-orders"
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                View all
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {stats.recentSalesOrders.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-10">No sales orders yet</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-white/8">
                {stats.recentSalesOrders.map((order) => (
                  <Link href={`/sales-orders/${order.id}`} key={order.id} className="cursor-pointer">
                    <div className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 rounded-xl px-2 -mx-2 hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors">
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-semibold text-gray-900">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {order.customer.name} · {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
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
          </div>

          <div className={`${panelClass} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Low Stock Items</h3>
              <Link
                href="/alerts"
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                View alerts
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {stats.lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="h-10 w-10 rounded-2xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mb-2">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <p className="text-sm font-medium text-gray-700">All stock levels are healthy</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {stats.lowStockItems.map((item) => {
                  const max = Math.max(item.minimumStockLevel, item.availableQuantity, 1);
                  const pct = Math.min(100, (item.availableQuantity / max) * 100);
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-rose-200/70 dark:border-rose-500/20 bg-rose-50/70 dark:bg-rose-500/10 px-3 py-2.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{item.product.name}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {item.product.sku ? `SKU: ${item.product.sku} · ` : ""}
                            {item.warehouse.name}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1.5 justify-end">
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                            <span className="text-lg font-bold text-rose-600 dark:text-rose-300">
                              {item.availableQuantity}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">Min: {item.minimumStockLevel}</p>
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-rose-200/70 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-rose-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/products/new"
              className={`${panelClass} flex items-center gap-3 p-4 hover:border-blue-300 hover:bg-blue-50/70 dark:hover:bg-blue-500/10 transition-colors cursor-pointer`}
            >
              <span className="h-10 w-10 rounded-xl bg-blue-500/12 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
                <Package className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-gray-800">Add Product</span>
            </Link>
            <Link
              href="/sales-orders/new"
              className={`${panelClass} flex items-center gap-3 p-4 hover:border-emerald-300 hover:bg-emerald-50/70 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer`}
            >
              <span className="h-10 w-10 rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <ClipboardList className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-gray-800">New Sales Order</span>
            </Link>
            <Link
              href="/purchase-orders/new"
              className={`${panelClass} flex items-center gap-3 p-4 hover:border-amber-300 hover:bg-amber-50/70 dark:hover:bg-amber-500/10 transition-colors cursor-pointer`}
            >
              <span className="h-10 w-10 rounded-xl bg-amber-500/12 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
                <ShoppingCart className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-gray-800">Purchase Order</span>
            </Link>
            <Link
              href="/alerts"
              className={`${panelClass} flex items-center gap-3 p-4 hover:border-rose-300 hover:bg-rose-50/70 dark:hover:bg-rose-500/10 transition-colors cursor-pointer`}
            >
              <span className="h-10 w-10 rounded-xl bg-rose-500/12 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-gray-800">View Alerts</span>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
