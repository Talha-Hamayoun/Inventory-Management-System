"use client";

import { DashboardLayout } from "@/src/components/dashboard-layout";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Loading } from "@/src/components/ui/loading";
import { salesOrdersApi, customersApi, warehousesApi, productsApi } from "@/src/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface CustomerOption { id: string; name: string; phone: string; }
interface WarehouseOption { id: string; name: string; }
interface ProductOption { id: string; name: string; sku: string | undefined; costPrice: number | null; sellingPrice: number | null; }

const selectClass = "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50";

export default function EditSalesOrderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loadingOrder, setLoadingOrder] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);

  const [panelItem, setPanelItem] = useState({ productId: "", quantity: 1, unitPrice: 0 });
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [duplicateMsg, setDuplicateMsg] = useState("");

  useEffect(() => {
    Promise.all([
      customersApi.list({ limit: 100 }),
      warehousesApi.list({ limit: 100, isActive: true }),
      productsApi.list({ page: 1, limit: 100, status: "ACTIVE" }),
      salesOrdersApi.get(id),
    ]).then(([c, w, p, order]) => {
      if (c.data?.success) setCustomers(c.data.data);
      if (w.data?.success) setWarehouses(w.data.data);
      if (p.data?.success) setProducts(p.data.data.map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        costPrice: item.costPrice ? Number(item.costPrice) : null,
        sellingPrice: item.sellingPrice ? Number(item.sellingPrice) : null,
      })));

      if (order.data?.success) {
        const o = order.data.data;
        if (o.status !== "PENDING") {
          toast.error("Only PENDING orders can be edited");
          router.push(`/sales-orders/${id}`);
          return;
        }
        setOrderNumber(o.orderNumber);
        setCustomerId(o.customerId);
        setWarehouseId(o.warehouseId);
        setNotes(o.notes || "");
        setItems(o.items.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
        })));
      } else {
        toast.error(order.data?.message || "Order not found");
        router.push("/sales-orders");
      }
      setLoadingOrder(false);
    });
  }, [id]);

  const panelProduct = products.find((p) => p.id === panelItem.productId) ?? null;
  const panelPriceError =
    panelProduct?.costPrice != null && panelItem.unitPrice < panelProduct.costPrice
      ? `Cannot be less than cost price (Rs. ${panelProduct.costPrice.toLocaleString()})`
      : null;

  const handlePanelProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setPanelItem({ ...panelItem, productId, unitPrice: product?.sellingPrice ?? 0 });
    setDuplicateMsg("");
  };

  const handleAddToOrder = () => {
    if (!panelItem.productId || panelPriceError) return;
    const product = products.find((p) => p.id === panelItem.productId);
    const existingIdx = items.findIndex((i) => i.productId === panelItem.productId);
    if (existingIdx !== -1) {
      const updated = [...items];
      updated[existingIdx] = {
        ...updated[existingIdx],
        quantity: updated[existingIdx].quantity + panelItem.quantity,
        unitPrice: panelItem.unitPrice,
      };
      setItems(updated);
      setDuplicateMsg("Product already in list — quantity updated.");
    } else {
      setItems([...items, {
        productId: panelItem.productId,
        productName: product?.name || "",
        quantity: panelItem.quantity,
        unitPrice: panelItem.unitPrice,
      }]);
      setDuplicateMsg("");
    }
    setPanelItem({ productId: "", quantity: 1, unitPrice: 0 });
  };

  const handleUpdateItem = () => {
    if (editIndex === null || panelPriceError) return;
    const product = products.find((p) => p.id === panelItem.productId);
    const updated = [...items];
    updated[editIndex] = {
      productId: panelItem.productId,
      productName: product?.name || "",
      quantity: panelItem.quantity,
      unitPrice: panelItem.unitPrice,
    };
    setItems(updated);
    setEditIndex(null);
    setPanelItem({ productId: "", quantity: 1, unitPrice: 0 });
    setDuplicateMsg("");
  };

  const handleEditItem = (index: number) => {
    const item = items[index];
    setEditIndex(index);
    setPanelItem({ productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice });
    setDuplicateMsg("");
  };

  const handleCancelEdit = () => {
    setEditIndex(null);
    setPanelItem({ productId: "", quantity: 1, unitPrice: 0 });
    setDuplicateMsg("");
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    if (editIndex === index) handleCancelEdit();
  };

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) { toast.error("Please select a customer"); return; }
    if (!warehouseId) { toast.error("Please select a warehouse"); return; }
    if (items.length === 0) { toast.error("Please add at least one item"); return; }
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (product?.costPrice != null && item.unitPrice < product.costPrice) {
        toast.error(`Unit price for "${item.productName}" cannot be less than cost price`);
        return;
      }
    }

    setSaving(true);
    try {
      const response = await salesOrdersApi.update(id, {
        customerId,
        warehouseId,
        notes: notes || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });
      if (response.data?.success) {
        toast.success("Order updated");
        router.push(`/sales-orders/${id}`);
      } else {
        toast.error(response.data?.message || "Failed to update order");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loadingOrder) {
    return <DashboardLayout><div className="flex justify-center py-16"><Loading size="lg" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href={`/sales-orders/${id}`}>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit {orderNumber}</h1>
            <p className="text-gray-600">Update this sales order (PENDING only)</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Order Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                  <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={selectClass} required>
                    <option value="">Select customer...</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse *</label>
                  <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className={selectClass} required>
                    <option value="">Select warehouse...</option>
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any special instructions..." className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Order Items</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Add / Edit Panel */}
              <div className="p-4 border rounded-lg bg-gray-50">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  {editIndex !== null ? "Edit Item" : "Add Item"}
                </p>
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-40">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Product</label>
                    <select
                      value={panelItem.productId}
                      onChange={(e) => handlePanelProductChange(e.target.value)}
                      className={selectClass}
                      disabled={editIndex !== null}
                    >
                      <option value="">Select product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Qty</label>
                    <Input
                      type="number" min={1}
                      value={panelItem.quantity}
                      onChange={(e) => setPanelItem({ ...panelItem, quantity: parseInt(e.target.value) || 1 })}
                      className="w-24"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Unit Price (Rs.)</label>
                    <Input
                      type="number" min={0} step="0.01"
                      value={panelItem.unitPrice}
                      onChange={(e) => setPanelItem({ ...panelItem, unitPrice: parseFloat(e.target.value) || 0 })}
                      className={`w-32 ${panelPriceError ? "border-red-500" : ""}`}
                    />
                  </div>
                  <div className="flex gap-2">
                    {editIndex === null ? (
                      <Button type="button" onClick={handleAddToOrder} disabled={!panelItem.productId || !!panelPriceError}>
                        Add to Order
                      </Button>
                    ) : (
                      <>
                        <Button type="button" onClick={handleUpdateItem} disabled={!!panelPriceError}>Update</Button>
                        <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                      </>
                    )}
                  </div>
                </div>
                {panelProduct && (panelProduct.costPrice != null || panelProduct.sellingPrice != null) && (
                  <p className="text-xs text-gray-400 mt-2">
                    Cost: Rs. {panelProduct.costPrice?.toLocaleString() ?? "—"} · Default selling: Rs. {panelProduct.sellingPrice?.toLocaleString() ?? "—"}
                  </p>
                )}
                {panelPriceError && <p className="text-xs text-red-500 mt-1">{panelPriceError}</p>}
                {duplicateMsg && <p className="text-xs text-green-600 mt-2">{duplicateMsg}</p>}
              </div>

              {/* Items Table */}
              {items.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Items Added ({items.length})</p>
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
                      {items.map((item, idx) => {
                        const sku = products.find((p) => p.id === item.productId)?.sku;
                        return (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                            <td className="px-3 py-2 font-medium">
                              {item.productName}
                              {sku && <span className="ml-1 text-xs text-gray-400">({sku})</span>}
                            </td>
                            <td className="px-3 py-2 text-right">{item.quantity}</td>
                            <td className="px-3 py-2 text-right">Rs. {item.unitPrice.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right font-medium">Rs. {(item.quantity * item.unitPrice).toLocaleString()}</td>
                            <td className="px-3 py-2">
                              <div className="flex justify-end gap-1">
                                <Button type="button" size="icon" variant="ghost" onClick={() => handleEditItem(idx)} title="Edit item">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button type="button" size="icon" variant="ghost" onClick={() => removeItem(idx)} title="Remove item">
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

              {items.length > 0 && (
                <div className="flex justify-end pt-4 border-t">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900">Rs. {totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Link href={`/sales-orders/${id}`}><Button type="button" variant="outline">Cancel</Button></Link>
            <Button type="submit" disabled={saving || items.length === 0}>
              {saving ? <Loading size="sm" /> : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
