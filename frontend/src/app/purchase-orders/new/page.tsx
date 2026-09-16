"use client";

import { DashboardLayout } from "@/src/components/dashboard-layout";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Loading } from "@/src/components/ui/loading";
import { productsApi, purchaseOrdersApi, suppliersApi, warehousesApi } from "@/src/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const orderSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  expectedDeliveryDate: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product is required"),
        orderedQuantity: z.number().int().positive("Quantity must be positive"),
        unitCost: z.number().min(0, "Unit cost must be 0 or more"),
      })
    )
    .min(1, "At least one item is required"),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface SimpleSupplier { id: string; name: string }
interface SimpleWarehouse { id: string; name: string }
interface SimpleProduct { id: string; name: string; sku?: string }

const selectClass =
  "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50";

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<SimpleSupplier[]>([]);
  const [warehouses, setWarehouses] = useState<SimpleWarehouse[]>([]);
  const [products, setProducts] = useState<SimpleProduct[]>([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: { items: [] },
  });

  const watchItems = watch("items");

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "items",
  });

  // Local state for the add/edit item panel
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [newItem, setNewItem] = useState({ productId: "", orderedQuantity: 1, unitCost: 0 });
  const [duplicateMsg, setDuplicateMsg] = useState("");

  // When entering edit mode, populate the panel — force Number() to prevent string type bleed
  useEffect(() => {
    if (editIndex !== null) {
      const item = watchItems[editIndex];
      if (item) {
        setNewItem({
          productId: item.productId,
          orderedQuantity: Number(item.orderedQuantity) || 1,
          unitCost: Number(item.unitCost) || 0,
        });
      }
    } else {
      setNewItem({ productId: "", orderedQuantity: 1, unitCost: 0 });
    }
  }, [editIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const [suppliersRes, warehousesRes, productsRes] = await Promise.all([
          suppliersApi.list({ page: 1, limit: 100 }),
          warehousesApi.list({ page: 1, limit: 100, isActive: true }),
          productsApi.list({ page: 1, limit: 100, status: "ACTIVE" }),
        ]);
        if (suppliersRes.data && suppliersRes.data.success) setSuppliers(suppliersRes.data.data || []);
        if (warehousesRes.data && warehousesRes.data.success) setWarehouses(warehousesRes.data.data || []);
        if (productsRes.data && productsRes.data.success) setProducts(productsRes.data.data || []);
      } catch (error) {
        console.error("Failed to fetch dropdowns:", error);
      }
    };
    fetchData();
  }, []);

  const calculateTotal = (): number =>
    watchItems.reduce(
      (sum, item) => sum + Number(item.orderedQuantity) * Number(item.unitCost),
      0
    );

  const handleAddItem = () => {
    if (!newItem.productId) return;
    const qty = Number(newItem.orderedQuantity) || 1;
    const cost = Number(newItem.unitCost) || 0;

    const existingIdx = watchItems.findIndex((i) => i.productId === newItem.productId);
    if (existingIdx !== -1) {
      update(existingIdx, {
        productId: watchItems[existingIdx].productId,
        orderedQuantity: Number(watchItems[existingIdx].orderedQuantity) + qty,
        unitCost: cost,
      });
      setDuplicateMsg("Product already in list — quantity updated.");
    } else {
      append({ productId: newItem.productId, orderedQuantity: qty, unitCost: cost });
      setDuplicateMsg("");
    }
    setNewItem({ productId: "", orderedQuantity: 1, unitCost: 0 });
  };

  const handleUpdateItem = () => {
    if (editIndex === null) return;
    update(editIndex, {
      productId: newItem.productId,
      orderedQuantity: Number(newItem.orderedQuantity) || 1,
      unitCost: Number(newItem.unitCost) || 0,
    });
    setEditIndex(null);
    setDuplicateMsg("");
  };

  const handleCancelEdit = () => {
    setEditIndex(null);
    setDuplicateMsg("");
  };

  const onSubmit = async (data: OrderFormData): Promise<void> => {
    setLoading(true);
    try {
      let expectedDeliveryDate = data.expectedDeliveryDate;
      if (expectedDeliveryDate && /^\d{4}-\d{2}-\d{2}$/.test(expectedDeliveryDate)) {
        expectedDeliveryDate = new Date(expectedDeliveryDate + "T00:00:00").toISOString();
      }

      const response = await purchaseOrdersApi.create({
        supplierId: data.supplierId,
        warehouseId: data.warehouseId,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        items: data.items.map((item) => ({
          productId: item.productId,
          orderedQuantity: Number(item.orderedQuantity),
          unitCost: Number(item.unitCost),
        })),
      });

      if (!response.data || response.error) {
        toast.error("Failed to create order");
      } else if (response.data.success === false) {
        toast.error(response.data.message || "Failed to create order");
      } else {
        toast.success("Purchase order created successfully");
        router.push("/purchase-orders");
      }
    } finally {
      setLoading(false);
    }
  };

  const isEditing = editIndex !== null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/purchase-orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Purchase Order</h1>
            <p className="text-gray-600">Create a new order from a supplier</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                  <select {...register("supplierId")} className={selectClass}>
                    <option value="">Select supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {errors.supplierId && (
                    <p className="text-sm text-red-500 mt-1">{errors.supplierId.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination Warehouse *
                  </label>
                  <select {...register("warehouseId")} className={selectClass}>
                    <option value="">Select warehouse</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                  </select>
                  {errors.warehouseId && (
                    <p className="text-sm text-red-500 mt-1">{errors.warehouseId.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Delivery Date
                  </label>
                  <Input type="date" {...register("expectedDeliveryDate")} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add / Edit Item Panel */}
              <div className="p-4 border rounded-lg bg-gray-50">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  {isEditing ? "Edit Item" : "Add Item"}
                </p>
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-40">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Product</label>
                    <select
                      value={newItem.productId}
                      onChange={(e) => {
                        setNewItem({ ...newItem, productId: e.target.value });
                        setDuplicateMsg("");
                      }}
                      className={selectClass}
                      disabled={isEditing}
                    >
                      <option value="">Select product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}{p.sku ? ` | ${p.sku}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                    <Input
                      type="number"
                      min={1}
                      value={newItem.orderedQuantity}
                      onChange={(e) =>
                        setNewItem({ ...newItem, orderedQuantity: Number(e.target.value) || 1 })
                      }
                      className="w-28"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Unit Price ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={newItem.unitCost}
                      onChange={(e) =>
                        setNewItem({ ...newItem, unitCost: Number(e.target.value) || 0 })
                      }
                      className="w-28"
                    />
                  </div>
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <Button type="button" onClick={handleAddItem} disabled={!newItem.productId}>
                        Add to Order
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
              {fields.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Items Added ({fields.length})
                  </p>
                  <table className="min-w-full border rounded-lg overflow-hidden text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">#</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Product</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-700">Qty</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-700">Unit Price</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-700">Subtotal</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field, idx) => {
                        const item = watchItems[idx];
                        const product = products.find((p) => p.id === item?.productId);
                        const qty = Number(item?.orderedQuantity) || 0;
                        const cost = Number(item?.unitCost) || 0;
                        return (
                          <tr key={field.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                            <td className="px-3 py-2 font-medium">
                              {product ? product.name : item?.productId}
                              {product?.sku && (
                                <span className="ml-1 text-xs text-gray-400">({product.sku})</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right">{qty}</td>
                            <td className="px-3 py-2 text-right">${cost.toFixed(2)}</td>
                            <td className="px-3 py-2 text-right font-medium">
                              ${(qty * cost).toFixed(2)}
                            </td>
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
                                  onClick={() => {
                                    remove(idx);
                                    if (editIndex === idx) setEditIndex(null);
                                  }}
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

              {errors.items?.message && (
                <p className="text-sm text-red-500">{errors.items.message}</p>
              )}

              {fields.length > 0 && (
                <div className="flex justify-end pt-4 border-t">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-2xl font-bold">${calculateTotal().toFixed(2)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link href="/purchase-orders">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? <Loading size="sm" /> : "Create Order"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
