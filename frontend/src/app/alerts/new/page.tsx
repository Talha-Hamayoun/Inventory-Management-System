"use client";

import { DashboardLayout } from "@/src/components/dashboard-layout";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Loading } from "@/src/components/ui/loading";
import { alertsApi, productsApi, warehousesApi } from "@/src/lib/api";
import type { AlertType } from "@/src/lib/api/alerts/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const selectClass =
  "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50";

interface SimpleProduct { id: string; name: string; sku: string | null }
interface SimpleWarehouse { id: string; name: string }

export default function NewAlertPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [warehouses, setWarehouses] = useState<SimpleWarehouse[]>([]);

  // Form fields
  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [alertType, setAlertType] = useState<AlertType>("LOW_STOCK");
  const [threshold, setThreshold] = useState(10);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, warehousesRes] = await Promise.all([
          productsApi.list({ page: 1, limit: 100, status: "ACTIVE" }),
          warehousesApi.list({ page: 1, limit: 100, isActive: true }),
        ]);
        if (productsRes.data?.success) {
          setProducts(
            (productsRes.data.data || []).map((p) => ({
              id: p.id,
              name: p.name,
              sku: p.sku ?? null,
            }))
          );
        }
        if (warehousesRes.data?.success) {
          setWarehouses(warehousesRes.data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!productId) newErrors.productId = "Product is required";
    if (!warehouseId) newErrors.warehouseId = "Warehouse is required";
    if (threshold < 0) newErrors.threshold = "Threshold must be 0 or greater";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await alertsApi.create({
        productId,
        warehouseId,
        alertType,
        threshold: Number(threshold),
      });

      if (!response.data || response.error) {
        toast.error("Failed to create alert");
      } else if (!response.data.success) {
        toast.error(response.data.message || "Failed to create alert");
      } else {
        toast.success("Alert rule created successfully");
        router.push("/alerts");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/alerts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Stock Alert</h1>
            <p className="text-gray-600">Configure an alert rule for low or out-of-stock conditions</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Alert Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Alert Rule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product *
                  </label>
                  <select
                    value={productId}
                    onChange={(e) => {
                      setProductId(e.target.value);
                      setErrors((prev) => ({ ...prev, productId: "" }));
                    }}
                    className={selectClass}
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.sku ? ` | ${p.sku}` : ""}
                      </option>
                    ))}
                  </select>
                  {errors.productId && (
                    <p className="text-sm text-red-500 mt-1">{errors.productId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Warehouse *
                  </label>
                  <select
                    value={warehouseId}
                    onChange={(e) => {
                      setWarehouseId(e.target.value);
                      setErrors((prev) => ({ ...prev, warehouseId: "" }));
                    }}
                    className={selectClass}
                  >
                    <option value="">Select warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                  {errors.warehouseId && (
                    <p className="text-sm text-red-500 mt-1">{errors.warehouseId}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alert Type *
                  </label>
                  <select
                    value={alertType}
                    onChange={(e) => setAlertType(e.target.value as AlertType)}
                    className={selectClass}
                  >
                    <option value="LOW_STOCK">Low Stock — triggers when stock falls below threshold</option>
                    <option value="OUT_OF_STOCK">Out of Stock — triggers when stock reaches zero</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Threshold *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={threshold}
                    onChange={(e) => {
                      setThreshold(parseInt(e.target.value, 10) || 0);
                      setErrors((prev) => ({ ...prev, threshold: "" }));
                    }}
                  />
                  {errors.threshold ? (
                    <p className="text-sm text-red-500 mt-1">{errors.threshold}</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">
                      {alertType === "LOW_STOCK"
                        ? "Alert triggers when available stock ≤ this value"
                        : "Not used for Out of Stock alerts (triggers at 0)"}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info banner */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
            {alertType === "LOW_STOCK" ? (
              <p>
                <strong>Low Stock:</strong> An alert will be triggered when the available quantity
                of the selected product in the selected warehouse drops to or below the threshold.
              </p>
            ) : (
              <p>
                <strong>Out of Stock:</strong> An alert will be triggered when the available
                quantity of the selected product in the selected warehouse reaches zero.
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link href="/alerts">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? <Loading size="sm" /> : "Create Alert Rule"}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
