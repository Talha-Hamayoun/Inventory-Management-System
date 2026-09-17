"use client";

import { DashboardLayout } from "@/src/components/dashboard-layout";
import { Button } from "@/src/components/ui/button";
import { Select } from "@/src/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Loading } from "@/src/components/ui/loading";
import { productsApi, reservationsApi, warehousesApi } from "@/src/lib/api";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";


interface SimpleProduct { id: string; name: string; sku: string | null }
interface SimpleWarehouse { id: string; name: string }
interface ReservationItem {
  productId: string;
  warehouseId: string;
  quantity: number;
}

export default function NewReservationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [warehouses, setWarehouses] = useState<SimpleWarehouse[]>([]);

  // Form state
  const [orderId, setOrderId] = useState("");
  const [orderIdError, setOrderIdError] = useState("");
  const [items, setItems] = useState<ReservationItem[]>([]);
  const [itemsError, setItemsError] = useState("");

  // Add/Edit panel
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [panel, setPanel] = useState<ReservationItem>({ productId: "", warehouseId: "", quantity: 1 });
  const [duplicateMsg, setDuplicateMsg] = useState("");

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
        console.error("Failed to fetch dropdowns:", error);
      }
    };
    fetchData();
  }, []);

  // When entering edit mode, load item into panel
  useEffect(() => {
    if (editIndex !== null && items[editIndex]) {
      setPanel({ ...items[editIndex] });
    } else {
      setPanel({ productId: "", warehouseId: "", quantity: 1 });
    }
    setDuplicateMsg("");
  }, [editIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddItem = () => {
    if (!panel.productId || !panel.warehouseId) return;
    const qty = Number(panel.quantity) || 1;

    const existingIdx = items.findIndex(
      (i) => i.productId === panel.productId && i.warehouseId === panel.warehouseId
    );

    if (existingIdx !== -1) {
      setItems((prev) =>
        prev.map((item, i) =>
          i === existingIdx ? { ...item, quantity: item.quantity + qty } : item
        )
      );
      setDuplicateMsg("Same product+warehouse already in list — quantity updated.");
    } else {
      setItems((prev) => [...prev, { productId: panel.productId, warehouseId: panel.warehouseId, quantity: qty }]);
      setDuplicateMsg("");
    }
    setPanel({ productId: "", warehouseId: "", quantity: 1 });
    setItemsError("");
  };

  const handleUpdateItem = () => {
    if (editIndex === null) return;
    setItems((prev) =>
      prev.map((item, i) =>
        i === editIndex
          ? { productId: panel.productId, warehouseId: panel.warehouseId, quantity: Number(panel.quantity) || 1 }
          : item
      )
    );
    setEditIndex(null);
    setDuplicateMsg("");
  };

  const handleCancelEdit = () => {
    setEditIndex(null);
    setDuplicateMsg("");
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    if (editIndex === index) setEditIndex(null);
  };

  const handleSubmit = async () => {
    setOrderIdError("");
    setItemsError("");

    const orderIdNum = parseInt(orderId, 10);
    if (!orderId || isNaN(orderIdNum) || orderIdNum <= 0) {
      setOrderIdError("Order ID must be a positive number");
      return;
    }
    if (items.length === 0) {
      setItemsError("Please add at least one item to reserve");
      return;
    }

    setLoading(true);
    try {
      const results = await Promise.all(
        items.map((item) =>
          reservationsApi.create({
            orderId: orderIdNum,
            productId: item.productId,
            warehouseId: item.warehouseId,
            quantity: Number(item.quantity),
          })
        )
      );

      const failed = results.filter((r) => !r.data || r.error || !r.data.success);

      if (failed.length === 0) {
        toast.success(
          items.length === 1
            ? "Reservation created successfully"
            : `${items.length} reservations created successfully`
        );
        router.push("/reservations");
      } else {
        const firstError = failed[0];
        const message =
          firstError.data && !firstError.data.success
            ? firstError.data.message
            : "Failed to create one or more reservations";
        toast.error(message || "Failed to create reservations");
      }
    } finally {
      setLoading(false);
    }
  };

  const isEditing = editIndex !== null;
  const totalQty = items.reduce((sum, i) => sum + Number(i.quantity), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/reservations">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Stock Reservation</h1>
            <p className="text-gray-600">Reserve stock for a customer order</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order ID *
                </label>
                <Input
                  type="number"
                  min="1"
                  value={orderId}
                  onChange={(e) => {
                    setOrderId(e.target.value);
                    setOrderIdError("");
                  }}
                  placeholder="e.g. 1001"
                />
                {orderIdError ? (
                  <p className="text-sm text-red-500 mt-1">{orderIdError}</p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">
                    Customer order reference number
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reservation Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items to Reserve</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add / Edit Panel */}
              <div className="p-4 border rounded-lg bg-gray-50">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  {isEditing ? "Edit Item" : "Add Item"}
                </p>
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-48">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Product</label>
                    <Select
                      value={panel.productId}
                      onChange={(e) => {
                        setPanel({ ...panel, productId: e.target.value });
                        setDuplicateMsg("");
                      }}
                      className="w-full"
                      disabled={isEditing}
                    >
                      <option value="">Select product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}{p.sku ? ` | ${p.sku}` : ""}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex-1 min-w-48">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Warehouse</label>
                    <Select
                      value={panel.warehouseId}
                      onChange={(e) => {
                        setPanel({ ...panel, warehouseId: e.target.value });
                        setDuplicateMsg("");
                      }}
                      className="w-full"
                      disabled={isEditing}
                    >
                      <option value="">Select warehouse</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                    <Input
                      type="number"
                      min={1}
                      value={panel.quantity}
                      onChange={(e) =>
                        setPanel({ ...panel, quantity: parseInt(e.target.value, 10) || 1 })
                      }
                      className="w-28"
                    />
                  </div>
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <Button
                        type="button"
                        onClick={handleAddItem}
                        disabled={!panel.productId || !panel.warehouseId}
                      >
                        Add to Reservation
                      </Button>
                    ) : (
                      <>
                        <Button type="button" onClick={handleUpdateItem}>
                          Update
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {duplicateMsg && (
                  <p className="text-xs text-green-600 mt-2">{duplicateMsg}</p>
                )}
              </div>

              {/* Items Table */}
              {items.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Items Added ({items.length})
                  </p>
                  <table className="min-w-full border rounded-lg overflow-hidden text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">#</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Product</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Warehouse</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-700">Quantity</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => {
                        const product = products.find((p) => p.id === item.productId);
                        const warehouse = warehouses.find((w) => w.id === item.warehouseId);
                        return (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                            <td className="px-3 py-2 font-medium">
                              {product ? product.name : item.productId}
                              {product?.sku && (
                                <span className="ml-1 text-xs text-gray-400">({product.sku})</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {warehouse ? warehouse.name : item.warehouseId}
                            </td>
                            <td className="px-3 py-2 text-right font-medium">{item.quantity}</td>
                            <td className="px-3 py-2">
                              <div className="flex justify-end gap-1">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setEditIndex(idx)}
                                  title="Edit item"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleRemoveItem(idx)}
                                  title="Remove item"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {itemsError && (
                <p className="text-sm text-red-500">{itemsError}</p>
              )}

              {items.length > 0 && (
                <div className="flex justify-end pt-4 border-t">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Units to Reserve</p>
                    <p className="text-2xl font-bold">{totalQty}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link href="/reservations">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? <Loading size="sm" /> : "Create Reservation"}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
