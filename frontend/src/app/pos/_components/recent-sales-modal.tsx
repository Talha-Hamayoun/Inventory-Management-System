"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/modal";
import { posApi, productsApi, salesOrdersApi } from "@/src/lib/api";
import type { PosProduct } from "@/src/lib/api/pos";
import {
  POS_PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
  type SalesOrder,
  type SalesOrderItem,
} from "@/src/lib/api/sales-orders/types";
import { resolveDiscount } from "@/src/lib/sales-order-discount";
import { cn } from "@/src/lib/utils";
import { toast } from "sonner";
import {
  CheckCircle2,
  History,
  Loader2,
  Minus,
  Pencil,
  Plus,
  ReceiptText,
  RefreshCw,
  ScanLine,
  Search,
  Trash2,
} from "lucide-react";

const BarcodeScannerModal = dynamic(
  () =>
    import("./barcode-scanner-modal").then((m) => m.BarcodeScannerModal),
  { ssr: false }
);
function formatMoney(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return `Rs ${n.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type NewLine = {
  key: string;
  productId: string;
  name: string;
  sku?: string | null;
  unitPrice: number;
  quantity: number;
  availableQuantity: number;
};

interface RecentSalesModalProps {
  isOpen: boolean;
  sales: SalesOrder[];
  loading?: boolean;
  canUpdate?: boolean;
  onClose: () => void;
  onRefresh: () => Promise<void> | void;
  onUpdated: (order: SalesOrder) => void;
  onViewReceipt: (order: SalesOrder) => void;
}

export function RecentSalesModal({
  isOpen,
  sales,
  loading,
  canUpdate,
  onClose,
  onRefresh,
  onUpdated,
  onViewReceipt,
}: RecentSalesModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SalesOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [received, setReceived] = useState(0);
  const [saving, setSaving] = useState(false);

  const [newItems, setNewItems] = useState<NewLine[]>([]);
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<PosProduct[]>([]);
  const [productSearching, setProductSearching] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [barcodeLoading, setBarcodeLoading] = useState(false);

  const editing = useMemo(
    () => sales.find((s) => s.id === editingId) ?? null,
    [sales, editingId]
  );

  useEffect(() => {
    if (!isOpen) {
      setEditingId(null);
      setDetail(null);
      setNewItems([]);
      setProductQuery("");
      setProductResults([]);
      setScannerOpen(false);
      setBarcodeLoading(false);
      setSaving(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!editingId) {
      setDetail(null);
      setNewItems([]);
      setProductQuery("");
      setProductResults([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setDetailLoading(true);
      const res = await salesOrdersApi.get(editingId);
      if (cancelled) return;
      if (res.data?.success && res.data.data) {
        setDetail(res.data.data);
      } else {
        toast.error("Failed to load sale details");
        setDetail(null);
      }
      setDetailLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [editingId]);

  useEffect(() => {
    if (!detail) return;
    const total = Number(detail.totalAmount);
    const nextMethod = (detail.paymentMethod as PaymentMethod) || "CASH";
    setMethod(nextMethod);
    setReceived(Number(detail.amountReceived ?? detail.amountPaid ?? total));
  }, [detail]);

  useEffect(() => {
    if (!editingId || !detail?.warehouseId) return;
    const q = productQuery.trim();
    if (q.length < 1) {
      setProductResults([]);
      return;
    }

    const t = setTimeout(async () => {
      setProductSearching(true);
      const res = await posApi.listProducts({
        warehouseId: detail.warehouseId,
        search: q,
        page: 1,
        limit: 8,
      });
      if (res.data?.success) {
        setProductResults(res.data.data || []);
      } else {
        setProductResults([]);
      }
      setProductSearching(false);
    }, 250);

    return () => clearTimeout(t);
  }, [productQuery, editingId, detail?.warehouseId]);

  const existingItems: SalesOrderItem[] = detail?.items ?? [];

  const existingSubtotal = existingItems.reduce(
    (sum, line) => sum + Number(line.totalPrice),
    0
  );
  const addedSubtotal = newItems.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0
  );
  const previewSubtotal = existingSubtotal + addedSubtotal;
  const discountPreview = resolveDiscount(
    previewSubtotal,
    detail?.discountType ?? null,
    Number(detail?.discountValue ?? 0)
  );
  const previewTotal = discountPreview.invoiceTotal;

  // Keep cash received at least the new grand total when items are added
  useEffect(() => {
    if (!detail || method !== "CASH") return;
    setReceived((prev) => (prev + 0.001 < previewTotal ? previewTotal : prev));
  }, [previewTotal, method, detail]);

  const changeDue = method === "CASH" ? Math.max(0, received - previewTotal) : 0;
  const cashShort = method === "CASH" && received + 0.001 < previewTotal;
  const hasNewItems = newItems.length > 0;

  const startEdit = (sale: SalesOrder) => {
    setEditingId(sale.id);
    setNewItems([]);
    setProductQuery("");
    setProductResults([]);
  };

  const addProduct = (product: PosProduct) => {
    if (product.outOfStock || product.availableQuantity < 1) {
      toast.error("Product is out of stock");
      return false;
    }
    const unitPrice = Number(product.sellingPrice ?? 0);
    let ok = true;
    setNewItems((prev) => {
      const existing = prev.find((p) => p.productId === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.availableQuantity) {
          toast.error(`Only ${product.availableQuantity} in stock`);
          ok = false;
          return prev;
        }
        return prev.map((p) =>
          p.productId === product.id
            ? { ...p, quantity: p.quantity + 1, availableQuantity: product.availableQuantity }
            : p
        );
      }
      return [
        ...prev,
        {
          key: `${product.id}-${Date.now()}`,
          productId: product.id,
          name: product.name,
          sku: product.sku,
          unitPrice,
          quantity: 1,
          availableQuantity: product.availableQuantity,
        },
      ];
    });
    if (ok) {
      setProductQuery("");
      setProductResults([]);
    }
    return ok;
  };

  const submitBarcode = async (code: string): Promise<boolean> => {
    const trimmed = code.trim();
    if (!trimmed || !detail?.warehouseId) return false;

    setBarcodeLoading(true);
    const res = await productsApi.lookupByBarcode(trimmed, detail.warehouseId);
    setBarcodeLoading(false);

    if (res.data?.success && res.data.data) {
      const p = res.data.data;
      const ok = addProduct({
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        sellingPrice: p.sellingPrice != null ? String(p.sellingPrice) : "0",
        availableQuantity: p.availableQuantity ?? 0,
        outOfStock: (p.availableQuantity ?? 0) <= 0,
        status: "ACTIVE",
        category: null,
      });
      if (ok) {
        toast.success(`Added ${p.name}`);
        return true;
      }
      return false;
    }

    const message =
      res.data && "message" in res.data
        ? String((res.data as { message?: string }).message || "Product not found for this barcode")
        : "Product not found for this barcode";
    toast.error(message);
    return false;
  };

  const setNewQty = (productId: string, quantity: number) => {
    setNewItems((prev) =>
      prev
        .map((p) => {
          if (p.productId !== productId) return p;
          const qty = Math.max(0, Math.min(quantity, p.availableQuantity));
          return { ...p, quantity: qty };
        })
        .filter((p) => p.quantity > 0)
    );
  };

  const removeNewItem = (productId: string) => {
    setNewItems((prev) => prev.filter((p) => p.productId !== productId));
  };

  const saveChanges = async () => {
    if (!editing || !canUpdate || !detail) return;
    if (cashShort) {
      toast.error("Cash received cannot be less than grand total");
      return;
    }
    if (discountPreview.error) {
      toast.error(discountPreview.error);
      return;
    }

    setSaving(true);
    try {
      if (hasNewItems) {
        const res = await salesOrdersApi.addItems(editing.id, {
          items: newItems.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
          amountPaid: previewTotal,
          paymentMethod: method,
          amountReceived: method === "CASH" ? received : previewTotal,
          changeDue: method === "CASH" ? changeDue : 0,
        });

        const payload = res.data as
          | { success?: boolean; message?: string; data?: SalesOrder }
          | undefined;
        if (!payload?.success || !payload.data) {
          const err = res.error as { response?: { data?: { message?: string } } } | undefined;
          toast.error(
            payload?.message ||
              err?.response?.data?.message ||
              "Failed to add items — restart the backend after rebuilding"
          );
          return;
        }

        toast.success("Sale updated with new items");
        onUpdated(payload.data);
        setEditingId(null);
        return;
      }

      const res = await salesOrdersApi.updatePayment(editing.id, {
        amountPaid: previewTotal,
        paymentMethod: method,
        amountReceived: method === "CASH" ? received : previewTotal,
        changeDue: method === "CASH" ? changeDue : 0,
      });

      const payload = res.data as
        | { success?: boolean; message?: string; data?: SalesOrder }
        | undefined;
      if (!payload?.success || !payload.data) {
        const err = res.error as { response?: { data?: { message?: string } } } | undefined;
        toast.error(
          payload?.message ||
            err?.response?.data?.message ||
            "Failed to update payment"
        );
        return;
      }

      toast.success("Sale payment updated");
      onUpdated(payload.data);
      setEditingId(null);
    } catch (e) {
      toast.error((e as Error).message || "Failed to save sale changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title="Recent Completed Sales" size="xl">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs text-gray-500">
          Last paid / fulfilled POS sales · add items or update payment
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => void onRefresh()}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </Button>
      </div>

      <div className="max-h-[65vh] space-y-2 overflow-y-auto pr-0.5">
        {loading && sales.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-500">Loading…</p>
        )}
        {!loading && sales.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-400">
            <History className="h-8 w-8 opacity-40" />
            <p className="text-sm">No completed sales yet</p>
          </div>
        )}

        {sales.map((sale, index) => {
          const isLatest = index === 0;
          const isEditing = editingId === sale.id;
          return (
            <div
              key={sale.id}
              className={cn(
                "rounded-xl border bg-white p-3 dark:bg-gray-50",
                isLatest ? "border-blue-300 ring-1 ring-blue-100" : "border-gray-200"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {sale.orderNumber}
                    </p>
                    {isLatest && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                        Latest
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      {sale.paymentStatus}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {sale.customer?.name || "Walk-in"} ·{" "}
                    {sale.warehouse?.name || "—"} ·{" "}
                    {sale.paymentMethod
                      ? PAYMENT_METHOD_LABELS[sale.paymentMethod]
                      : "—"}{" "}
                    · {formatMoney(sale.totalAmount)}
                  </p>
                  <p className="text-[11px] text-gray-400">{formatDate(sale.createdAt)}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1"
                    onClick={() => onViewReceipt(sale)}
                  >
                    <ReceiptText className="h-3.5 w-3.5" />
                    Receipt
                  </Button>
                  {canUpdate && (
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 gap-1"
                      variant={isEditing ? "outline" : "default"}
                      onClick={() =>
                        isEditing ? setEditingId(null) : startEdit(sale)
                      }
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      {isEditing ? "Cancel" : "Update"}
                    </Button>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="mt-3 space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3 dark:bg-blue-500/10">
                  {detailLoading && (
                    <p className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Loading items…
                    </p>
                  )}

                  {!detailLoading && detail && (
                    <>
                      <div>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Current Items
                        </p>
                        <div className="space-y-1 rounded-lg border border-gray-200 bg-white p-2">
                          {existingItems.length === 0 && (
                            <p className="py-2 text-center text-xs text-gray-400">No items</p>
                          )}
                          {existingItems.map((line) => (
                            <div
                              key={line.id}
                              className="flex items-center justify-between gap-2 text-xs text-gray-700"
                            >
                              <span className="min-w-0 truncate font-medium">
                                {line.product?.name || "Product"}
                                <span className="ml-1 font-normal text-gray-400">
                                  ×{line.quantity}
                                </span>
                              </span>
                              <span className="shrink-0 tabular-nums">
                                {formatMoney(line.totalPrice)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Add New Item
                        </p>
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                          <Input
                            value={productQuery}
                            onChange={(e) => setProductQuery(e.target.value)}
                            placeholder="Search name, SKU or scan barcode…"
                            className="h-9 bg-white pl-8 pr-10 font-mono text-sm"
                            disabled={barcodeLoading}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            onKeyDown={(e) => {
                              if (e.key !== "Enter") return;
                              e.preventDefault();
                              e.stopPropagation();
                              const code = productQuery.trim();
                              if (!code || barcodeLoading) return;
                              void submitBarcode(code);
                            }}
                          />
                          <button
                            type="button"
                            disabled={barcodeLoading || !detail?.warehouseId}
                            onClick={() => setScannerOpen(true)}
                            className="absolute right-1.5 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-blue-600 hover:bg-blue-100 disabled:pointer-events-none disabled:opacity-40"
                            title="Open camera barcode scanner"
                            aria-label="Open camera barcode scanner"
                          >
                            {barcodeLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ScanLine className="h-4 w-4" />
                            )}
                          </button>
                          {(productSearching || productResults.length > 0) && productQuery.trim() && (
                            <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                              {productSearching && productResults.length === 0 && (
                                <p className="px-3 py-2 text-xs text-gray-400">Searching…</p>
                              )}
                              {productResults.map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => addProduct(p)}
                                  className="flex w-full cursor-pointer items-center justify-between gap-2 border-b border-gray-50 px-3 py-2 text-left text-xs last:border-0 hover:bg-blue-50"
                                >
                                  <span className="min-w-0">
                                    <span className="block truncate font-medium text-gray-900">
                                      {p.name}
                                    </span>
                                    <span className="text-gray-400">
                                      {p.sku || "—"} · Stock {p.availableQuantity}
                                    </span>
                                  </span>
                                  <span className="shrink-0 font-semibold text-blue-700">
                                    {formatMoney(p.sellingPrice)}
                                  </span>
                                </button>
                              ))}
                              {!productSearching && productResults.length === 0 && (
                                <p className="px-3 py-2 text-xs text-gray-400">No products found</p>
                              )}
                            </div>
                          )}
                        </div>
                        <p className="mt-1 text-[10px] text-gray-400">
                          USB scanner: scan into this field then Enter · Camera: tap the scan icon
                        </p>

                        {newItems.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            {newItems.map((line) => (
                              <div
                                key={line.key}
                                className="flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-white px-2 py-1.5"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-medium text-gray-900">
                                    {line.name}
                                  </p>
                                  <p className="text-[10px] text-gray-400">
                                    {formatMoney(line.unitPrice)} each · stock {line.availableQuantity}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50"
                                    onClick={() => setNewQty(line.productId, line.quantity - 1)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <Input
                                    type="number"
                                    min={1}
                                    max={line.availableQuantity}
                                    value={line.quantity}
                                    onChange={(e) =>
                                      setNewQty(line.productId, Number(e.target.value) || 1)
                                    }
                                    className="h-7 w-14 bg-white px-1 text-center text-xs"
                                  />
                                  <button
                                    type="button"
                                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50"
                                    onClick={() => setNewQty(line.productId, line.quantity + 1)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50"
                                    onClick={() => removeNewItem(line.productId)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                                <span className="w-16 text-right text-xs font-semibold tabular-nums text-gray-900">
                                  {formatMoney(line.unitPrice * line.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          Grand Total
                          {hasNewItems && (
                            <span className="ml-1 text-[10px] font-medium text-blue-600">
                              (includes new items)
                            </span>
                          )}
                        </span>
                        <span className="font-bold text-blue-700">
                          {formatMoney(previewTotal)}
                        </span>
                      </div>

                      <div>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Payment Method
                        </p>
                        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                          {POS_PAYMENT_METHODS.map((m) => (
                            <button
                              key={m.value}
                              type="button"
                              onClick={() => setMethod(m.value)}
                              className={cn(
                                "rounded-lg border px-2 py-2 text-xs font-medium cursor-pointer",
                                method === m.value
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                              )}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {method === "CASH" && (
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                              Amount Received
                            </label>
                            <Input
                              type="number"
                              min={0}
                              step="1"
                              value={received}
                              onChange={(e) => setReceived(Number(e.target.value) || 0)}
                              className="h-9 bg-white"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                              Change Due
                            </label>
                            <Input
                              value={formatMoney(changeDue)}
                              readOnly
                              className="h-9 bg-white"
                            />
                          </div>
                        </div>
                      )}

                      {cashShort && (
                        <p className="text-xs text-rose-600">
                          Cash received is less than the sale total.
                        </p>
                      )}

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={saving}
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={saving || cashShort || detailLoading}
                          onClick={() => void saveChanges()}
                        >
                          {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                          {hasNewItems ? "Save Items & Payment" : "Save Payment"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>

    <BarcodeScannerModal
      isOpen={scannerOpen}
      onClose={() => setScannerOpen(false)}
      onScan={async (code) => {
        const ok = await submitBarcode(code);
        if (ok) setScannerOpen(false);
        return ok;
      }}
    />
    </>
  );
}
