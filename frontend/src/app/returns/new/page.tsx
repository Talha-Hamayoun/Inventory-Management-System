"use client";

import { DashboardLayout } from "@/src/components/dashboard-layout";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Loading } from "@/src/components/ui/loading";
import { returnsApi, salesOrdersApi, purchaseOrdersApi, warehousesApi } from "@/src/lib/api";
import type { ReturnCondition, ReturnType } from "@/src/lib/api/returns/types";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const selectClass =
  "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50";

interface ReturnItemRow {
  productId: string;
  productName: string;
  sku: string | null;
  quantity: number;
  condition: ReturnCondition;
  maxQuantity: number;
}

interface OrderListItem { id: string; label: string; warehouseId: string; }
interface AvailableProduct { productId: string; name: string; sku: string | null; maxQty: number; }
interface WarehouseOption { id: string; name: string; }

export default function NewReturnPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);

  const [returnType, setReturnType] = useState<ReturnType>("SALES_RETURN");
  const [warehouseId, setWarehouseId] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ReturnItemRow[]>([]);

  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [orderList, setOrderList] = useState<OrderListItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);

  const [panelProductId, setPanelProductId] = useState("");
  const [panelQty, setPanelQty] = useState(1);
  const [panelCondition, setPanelCondition] = useState<ReturnCondition>("RESTOCKABLE");
  const [duplicateMsg, setDuplicateMsg] = useState("");

  useEffect(() => {
    warehousesApi.list({ limit: 100, isActive: true }).then((r) => {
      if (r.data?.success) setWarehouses(r.data.data || []);
    });
  }, []);

  // Load order list when return type changes
  useEffect(() => {
    setSelectedOrderId("");
    setAvailableProducts([]);
    setItems([]);
    setPanelProductId("");
    setDuplicateMsg("");

    if (returnType === "SALES_RETURN") {
      salesOrdersApi.list({ limit: 100, status: "FULFILLED" }).then((r) => {
        if (r.data?.success) {
          setOrderList(
            (r.data.data || []).map((o: any) => ({
              id: o.id,
              label: o.orderNumber,
              warehouseId: o.warehouseId,
            }))
          );
        }
      });
    } else {
      purchaseOrdersApi.list({ limit: 100 }).then((r) => {
        if (r.data?.success) {
          setOrderList(
            (r.data.data || [])
              .filter((o: any) => o.status === "COMPLETED" || o.status === "PARTIALLY_RECEIVED")
              .map((o: any) => ({
                id: o.id,
                label: `PO-${String(o.id).slice(-6)}  (${o.supplier?.name ?? "Unknown supplier"})`,
                warehouseId: o.warehouseId,
              }))
          );
        }
      });
    }
  }, [returnType]);

  // Fetch full order detail when an order is selected
  const handleOrderSelect = async (orderId: string) => {
    setSelectedOrderId(orderId);
    setAvailableProducts([]);
    setItems([]);
    setPanelProductId("");
    setDuplicateMsg("");

    if (!orderId) return;

    const matchedOrder = orderList.find((o) => o.id === orderId);
    if (matchedOrder) setWarehouseId(matchedOrder.warehouseId);

    setLoadingOrder(true);
    try {
      if (returnType === "SALES_RETURN") {
        const r = await salesOrdersApi.get(orderId);
        if (r.data?.success) {
          setAvailableProducts(
            (r.data.data.items || []).map((i: any) => ({
              productId: i.productId,
              name: i.product.name,
              sku: i.product.sku ?? null,
              maxQty: i.quantity,
            }))
          );
        }
      } else {
        const r = await purchaseOrdersApi.get(orderId);
        if (r.data?.success) {
          setAvailableProducts(
            (r.data.data.items || [])
              .filter((i: any) => i.receivedQuantity > 0)
              .map((i: any) => ({
                productId: i.productId,
                name: i.product?.name ?? i.productId,
                sku: i.product?.sku ?? null,
                maxQty: i.receivedQuantity,
              }))
          );
        }
      }
    } finally {
      setLoadingOrder(false);
    }
  };

  const panelProduct = availableProducts.find((p) => p.productId === panelProductId) ?? null;

  const handleAddItem = () => {
    if (!panelProductId || !panelProduct) return;
    const existingIdx = items.findIndex((i) => i.productId === panelProductId);
    if (existingIdx !== -1) {
      const updated = [...items];
      updated[existingIdx].quantity = Math.min(
        updated[existingIdx].quantity + panelQty,
        panelProduct.maxQty
      );
      updated[existingIdx].condition = panelCondition;
      setItems(updated);
      setDuplicateMsg("Product already in list — quantity updated.");
    } else {
      setItems([...items, {
        productId: panelProductId,
        productName: panelProduct.name,
        sku: panelProduct.sku,
        quantity: Math.min(panelQty, panelProduct.maxQty),
        condition: panelCondition,
        maxQuantity: panelProduct.maxQty,
      }]);
      setDuplicateMsg("");
    }
    setPanelProductId("");
    setPanelQty(1);
    setPanelCondition("RESTOCKABLE");
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!selectedOrderId) {
      toast.error(`Please select a ${returnType === "SALES_RETURN" ? "sales order" : "purchase order"}`);
      return;
    }
    if (!warehouseId) { toast.error("Please select a warehouse"); return; }
    if (items.length === 0) { toast.error("Please add at least one item"); return; }

    setSaving(true);
    try {
      const response = await returnsApi.create({
        returnType,
        salesOrderId: returnType === "SALES_RETURN" ? selectedOrderId : undefined,
        purchaseOrderId: returnType === "PURCHASE_RETURN" ? selectedOrderId : undefined,
        warehouseId,
        notes: notes || undefined,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, condition: i.condition })),
      });
      if (response.data?.success) {
        toast.success("Return created");
        router.push(`/returns/${response.data.data.id}`);
      } else {
        toast.error(response.data?.message || "Failed to create return");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/returns">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Return</h1>
            <p className="text-gray-600">Create a new return order</p>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Return Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Return Type *</label>
                <select
                  value={returnType}
                  onChange={(e) => setReturnType(e.target.value as ReturnType)}
                  className={selectClass}
                >
                  <option value="SALES_RETURN">Sales Return (Customer → Us)</option>
                  <option value="PURCHASE_RETURN">Purchase Return (Us → Supplier)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {returnType === "SALES_RETURN" ? "Sales Order *" : "Purchase Order *"}
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => handleOrderSelect(e.target.value)}
                  className={selectClass}
                >
                  <option value="">
                    {returnType === "SALES_RETURN"
                      ? "Select fulfilled sales order..."
                      : "Select received purchase order..."}
                  </option>
                  {orderList.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
                {orderList.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {returnType === "SALES_RETURN"
                      ? "No FULFILLED sales orders found"
                      : "No received purchase orders found"}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse *</label>
                <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className={selectClass}>
                  <option value="">Select warehouse...</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Any notes..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Return Items</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {loadingOrder ? (
              <div className="flex justify-center py-4"><Loading size="sm" /></div>
            ) : (
              <div className="p-4 border rounded-lg bg-gray-50">
                <p className="text-sm font-medium text-gray-700 mb-3">Add Item</p>
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-40">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Product</label>
                    <select
                      value={panelProductId}
                      onChange={(e) => { setPanelProductId(e.target.value); setDuplicateMsg(""); }}
                      className={selectClass}
                      disabled={!selectedOrderId || availableProducts.length === 0}
                    >
                      <option value="">
                        {!selectedOrderId
                          ? "Select order first"
                          : availableProducts.length === 0
                          ? "No products available"
                          : "Select product..."}
                      </option>
                      {availableProducts.map((p) => (
                        <option key={p.productId} value={p.productId}>
                          {p.name}{p.sku ? ` (${p.sku})` : ""} — max: {p.maxQty}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Qty</label>
                    <Input
                      type="number"
                      min={1}
                      max={panelProduct?.maxQty ?? 9999}
                      value={panelQty}
                      onChange={(e) => setPanelQty(parseInt(e.target.value) || 1)}
                      className="w-24"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Condition</label>
                    <select
                      value={panelCondition}
                      onChange={(e) => setPanelCondition(e.target.value as ReturnCondition)}
                      className={selectClass + " w-44"}
                    >
                      <option value="RESTOCKABLE">
                        {returnType === "PURCHASE_RETURN" ? "Good Condition" : "Restockable"}
                      </option>
                      <option value="DAMAGED">Damaged</option>
                    </select>
                  </div>
                  <Button type="button" onClick={handleAddItem} disabled={!panelProductId}>
                    Add Item
                  </Button>
                </div>
                {duplicateMsg && <p className="text-xs text-green-600 mt-2">{duplicateMsg}</p>}
              </div>
            )}

            {items.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Items ({items.length})</p>
                <table className="min-w-full border rounded-lg overflow-hidden text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">#</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Product</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">Qty</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Condition</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                        <td className="px-3 py-2 font-medium">
                          {item.productName}
                          {item.sku && <span className="ml-1 text-xs text-gray-400">({item.sku})</span>}
                        </td>
                        <td className="px-3 py-2 text-right">{item.quantity}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.condition === "RESTOCKABLE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {item.condition === "RESTOCKABLE"
                              ? returnType === "PURCHASE_RETURN" ? "Good Condition" : "Restockable"
                              : "Damaged"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button type="button" size="icon" variant="ghost" onClick={() => removeItem(idx)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {returnType === "SALES_RETURN" ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
            <strong>Sales Return:</strong> Customer returns items to you. RESTOCKABLE → added to available stock. DAMAGED → added to damaged inventory. Stock only updates after "Process".
          </div>
        ) : (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
            <strong>Purchase Return:</strong> You return items to the supplier. Stock is deducted from available inventory after "Process".
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link href="/returns"><Button type="button" variant="outline">Cancel</Button></Link>
          <Button onClick={handleSubmit} disabled={saving || items.length === 0}>
            {saving ? <Loading size="sm" /> : "Create Return"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
