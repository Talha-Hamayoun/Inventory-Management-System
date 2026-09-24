"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Select } from "@/src/components/ui/select";
import { PageLoading } from "@/src/components/ui/loading";
import { LayoutBackground } from "@/src/components/layout-background";
import { useAuth } from "@/src/lib/auth-context";
import { categoriesApi, posApi, productsApi, salesOrdersApi, warehousesApi } from "@/src/lib/api";
import type { PosCartItem, PosHeldSale, PosProduct } from "@/src/lib/api/pos";
import type { DiscountType, PaymentMethod, SalesOrder } from "@/src/lib/api/sales-orders/types";
import { resolveDiscount } from "@/src/lib/sales-order-discount";
import { toast } from "sonner";
import {
  ArrowLeft,
  History,
  LayoutDashboard,
  PauseCircle,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import { BarcodeInput } from "./_components/barcode-input";
import { ProductSearch } from "./_components/product-search";
import { CategoryFilter } from "./_components/category-filter";
import { ProductGrid } from "./_components/product-grid";
import { PosCart } from "./_components/pos-cart";
import { CartItemsPanel } from "./_components/cart-items-panel";
import { CustomerSelector } from "./_components/customer-selector";
import { PaymentModal } from "./_components/payment-modal";
import { Receipt } from "./_components/receipt";
import { HeldSalesModal } from "./_components/held-sales-modal";
import { RecentSalesModal } from "./_components/recent-sales-modal";

const BarcodeScannerModal = dynamic(
  () =>
    import("./_components/barcode-scanner-modal").then((m) => m.BarcodeScannerModal),
  { ssr: false }
);

type Warehouse = { id: string; name: string };
type Category = { id: string; name: string };
type WalkIn = { id: string; name: string; phone: string; isWalkIn?: boolean };

function useDebounced<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function PosPage() {
  const router = useRouter();
  const { user, loading: authLoading, hasPermission, hasAnyPermission } = useAuth();
  const canView = hasAnyPermission(["pos:view", "pos:create-sale", "sales-orders:create"]);
  const canCreate = hasAnyPermission(["pos:create-sale", "sales-orders:create"]);
  const canHold = hasAnyPermission(["pos:hold-sale", "pos:create-sale", "sales-orders:create"]);
  const canDiscount = hasAnyPermission([
    "pos:apply-discount",
    "pos:create-sale",
    "*",
    "sales-orders:create",
  ]);
  const canCreateCustomer = hasPermission("customers:create") || hasPermission("*");
  const canUpdatePayment = hasAnyPermission([
    "sales-orders:update",
    "pos:create-sale",
    "*",
  ]);

  const barcodeRef = useRef<HTMLInputElement>(null);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 300);
  const [barcode, setBarcode] = useState("");
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [discountType, setDiscountType] = useState<DiscountType | null>(null);
  const [discountValue, setDiscountValue] = useState(0);
  const [walkIn, setWalkIn] = useState<WalkIn | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [activeHeldId, setActiveHeldId] = useState<string | null>(null);

  const [payOpen, setPayOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [holding, setHolding] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<SalesOrder | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const [heldOpen, setHeldOpen] = useState(false);
  const [heldSales, setHeldSales] = useState<PosHeldSale[]>([]);
  const [heldLoading, setHeldLoading] = useState(false);

  const [recentOpen, setRecentOpen] = useState(false);
  const [recentSales, setRecentSales] = useState<SalesOrder[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }
    if (!authLoading && user && !canView) {
      toast.error("You do not have access to POS");
      router.replace("/dashboard");
    }
  }, [authLoading, user, canView, router]);

  useEffect(() => {
    if (!canView) return;
    (async () => {
      const [whRes, catRes, walkRes] = await Promise.all([
        warehousesApi.list({ limit: 100 }),
        categoriesApi.list({ limit: 100 }),
        posApi.getWalkInCustomer(),
      ]);
      if (whRes.data?.success && Array.isArray(whRes.data.data)) {
        const list = whRes.data.data as Warehouse[];
        setWarehouses(list);
        if (list[0]) setWarehouseId(list[0].id);
      }
      if (catRes.data?.success && Array.isArray(catRes.data.data)) {
        setCategories(catRes.data.data as Category[]);
      }
      if (walkRes.data?.success && walkRes.data.data) {
        const w = { ...walkRes.data.data, isWalkIn: true };
        setWalkIn(w);
        setCustomerId(w.id);
      }
    })();
  }, [canView]);

  const loadProducts = useCallback(async () => {
    if (!warehouseId) return;
    setProductsLoading(true);
    const res = await posApi.listProducts({
      warehouseId,
      page,
      limit: 24,
      search: debouncedSearch || undefined,
      categoryId: categoryId || undefined,
    });
    if (res.data?.success) {
      setProducts(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } else {
      toast.error(res.data?.message || "Failed to load products");
    }
    setProductsLoading(false);
  }, [warehouseId, page, debouncedSearch, categoryId]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryId, warehouseId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const addProductToCart = useCallback((product: PosProduct, qty = 1): boolean => {
    if (product.availableQuantity <= 0) {
      toast.error("Out of stock");
      return false;
    }
    let added = false;
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        const nextQty = Math.min(existing.availableQuantity, existing.quantity + qty);
        if (nextQty === existing.quantity) {
          toast.error("Cannot exceed available stock");
          return prev;
        }
        added = true;
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: nextQty } : i
        );
      }
      added = true;
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          unitPrice: Number(product.sellingPrice ?? 0),
          quantity: Math.min(qty, product.availableQuantity),
          availableQuantity: product.availableQuantity,
          categoryName: product.category?.name ?? null,
        },
      ];
    });
    return added;
  }, []);

  const handleBarcodeSubmit = useCallback(
    async (code: string, options?: { successToast?: boolean }): Promise<boolean> => {
      const trimmed = code.trim();
      if (!trimmed) return false;
      if (!warehouseId) {
        toast.error("Select a warehouse first");
        return false;
      }
      setBarcodeLoading(true);
      const res = await productsApi.lookupByBarcode(trimmed, warehouseId);
      setBarcodeLoading(false);
      if (res.data?.success && res.data.data) {
        const p = res.data.data;
        const ok = addProductToCart(
          {
            id: p.id,
            name: p.name,
            sku: p.sku,
            barcode: p.barcode,
            sellingPrice: p.sellingPrice != null ? String(p.sellingPrice) : "0",
            availableQuantity: p.availableQuantity ?? 0,
            outOfStock: (p.availableQuantity ?? 0) <= 0,
            status: "ACTIVE",
            category: null,
          },
          1
        );
        if (ok) {
          if (options?.successToast) {
            toast.success(`Added ${p.name}`);
          }
          setBarcode("");
          requestAnimationFrame(() => barcodeRef.current?.focus());
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
    },
    [warehouseId, addProductToCart]
  );

  const increaseQty = (productId: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        if (item.quantity >= item.availableQuantity) {
          toast.error("Insufficient stock");
          return item;
        }
        return { ...item, quantity: item.quantity + 1 };
      })
    );
  };

  const decreaseQty = (productId: string) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountType(null);
    setDiscountValue(0);
    setActiveHeldId(null);
    if (walkIn) setCustomerId(walkIn.id);
  };

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart]
  );
  const discount = resolveDiscount(subtotal, discountType, discountValue);
  const grandTotal = discount.invoiceTotal;

  useEffect(() => {
    if (!canView) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        document.getElementById("pos-product-search")?.focus();
      } else if (e.key === "F4") {
        e.preventDefault();
        barcodeRef.current?.focus();
      } else if (e.key === "F8") {
        e.preventDefault();
        if (cart.length > 0 && canCreate && !discount.error) setPayOpen(true);
      } else if (e.key === "Escape" && payOpen && !submitting) {
        setPayOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canView, cart.length, canCreate, discount.error, payOpen, submitting]);

  const loadHeld = async () => {
    setHeldLoading(true);
    const res = await posApi.listHeld();
    if (res.data?.success) setHeldSales(res.data.data || []);
    setHeldLoading(false);
  };

  const loadRecentSales = useCallback(async () => {
    setRecentLoading(true);
    const res = await salesOrdersApi.list({
      status: "FULFILLED",
      page: 1,
      limit: 25,
    });
    if (res.data?.success) {
      setRecentSales(res.data.data || []);
    } else {
      toast.error("Failed to load completed sales");
    }
    setRecentLoading(false);
  }, []);

  const holdSale = async () => {
    if (!canHold || !warehouseId || cart.length === 0) return;
    setHolding(true);
    const res = await posApi.hold({
      warehouseId,
      customerId,
      cartData: {
        items: cart,
        discountType,
        discountValue,
      },
    });
    setHolding(false);
    if (res.data?.success) {
      toast.success("Sale held");
      clearCart();
    } else {
      toast.error(res.data?.message || "Failed to hold sale");
    }
  };

  const resumeHeld = (sale: PosHeldSale) => {
    setWarehouseId(sale.warehouseId);
    setCustomerId(sale.customerId || walkIn?.id || null);
    setCart(sale.cartData.items || []);
    setDiscountType(sale.cartData.discountType ?? null);
    setDiscountValue(sale.cartData.discountValue ?? 0);
    setActiveHeldId(sale.id);
    setHeldOpen(false);
    toast.success("Held sale resumed");
  };

  const deleteHeld = async (id: string) => {
    const res = await posApi.deleteHeld(id);
    if (res.data?.success) {
      setHeldSales((prev) => prev.filter((s) => s.id !== id));
      if (activeHeldId === id) setActiveHeldId(null);
      toast.success("Held sale deleted");
    } else {
      toast.error(res.data?.message || "Failed to delete");
    }
  };

  const completeSale = async (payload: {
    paymentMethod: PaymentMethod;
    amountPaid: number;
    amountReceived: number;
  }) => {
    if (!canCreate || submitting || !warehouseId || cart.length === 0) return;
    setSubmitting(true);
    const res = await posApi.checkout({
      warehouseId,
      customerId: customerId || undefined,
      items: cart.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      paymentMethod: payload.paymentMethod,
      amountPaid: payload.amountPaid,
      amountReceived: payload.amountReceived,
      discountType: discountType || undefined,
      discountValue: discountType ? discountValue : undefined,
      heldSaleId: activeHeldId || undefined,
    });
    setSubmitting(false);
    if (res.data?.success && res.data.data) {
      const order = res.data.data as SalesOrder;
      setCompletedOrder(order);
      setRecentSales((prev) => [order, ...prev.filter((s) => s.id !== order.id)].slice(0, 25));
      setPayOpen(false);
      setReceiptOpen(true);
      clearCart();
      loadProducts();
      toast.success("Sale completed");
    } else {
      toast.error(res.data?.message || "Checkout failed");
    }
  };

  const openRecentSaleReceipt = async (sale: SalesOrder) => {
    const res = await salesOrdersApi.get(sale.id);
    if (res.data?.success && res.data.data) {
      setCompletedOrder(res.data.data);
      setReceiptOpen(true);
      setRecentOpen(false);
      return;
    }
    toast.error(res.data?.message || "Failed to load receipt");
  };

  if (authLoading || !user) {
    return (
      <div className="relative min-h-screen">
        <LayoutBackground />
        <div className="relative z-10">
          <PageLoading />
        </div>
      </div>
    );
  }

  if (!canView) return null;

  return (
    <div className="relative h-screen overflow-hidden bg-slate-100 dark:bg-[#070b14]">
      <LayoutBackground />

      <div className="relative z-10 flex h-full flex-col">
        {/* Standalone POS top bar */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/40 bg-white/85 px-3 py-2.5 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1220]/90 sm:px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Admin</span>
              <LayoutDashboard className="h-4 w-4 sm:hidden" />
            </Link>
            <div className="hidden h-8 w-px bg-gray-200 dark:bg-white/10 sm:block" />
            <div className="flex min-w-0 items-center gap-2">
              <Image
                src="/Logo2.png"
                alt="AutoLine"
                width={140}
                height={40}
                className="hidden h-8 w-auto object-contain sm:block"
                unoptimized
                priority
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-900 sm:text-base">Point of Sale</p>
                <p className="hidden text-[11px] text-gray-500 sm:block">
                  F2 Search · F4 Barcode · F8 Pay
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-2 py-1">
              <WarehouseIcon className="hidden h-4 w-4 text-gray-400 sm:block" />
              <Select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="min-w-36 border-0 bg-transparent shadow-none"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-10 gap-2 rounded-xl bg-gray-50"
              onClick={async () => {
                setRecentOpen(true);
                await loadRecentSales();
              }}
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Recent Sales</span>
            </Button>
            {canHold && (
              <Button
                type="button"
                variant="outline"
                className="h-10 gap-2 rounded-xl bg-gray-50"
                onClick={async () => {
                  setHeldOpen(true);
                  await loadHeld();
                }}
              >
                <PauseCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Held Sales</span>
              </Button>
            )}
            <div className="hidden items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1.5 md:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-gray-900">{user.name}</p>
                <p className="truncate text-[10px] text-gray-500">{user.role?.name}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main cashier workspace */}
        <main className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-4 xl:grid-cols-[170px_minmax(0,1fr)_340px]">
          {/* 1. Categories */}
          <section className="hidden min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-sm xl:flex">
            <div className="border-b border-gray-100 px-3 py-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500">1. Categories</h2>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              <CategoryFilter
                categories={categories}
                selectedId={categoryId}
                onSelect={setCategoryId}
              />
            </div>
          </section>

          {/* Center: Find → Cart items → Products */}
          <section className="flex min-h-0 flex-col gap-3 overflow-hidden">
            <div className="shrink-0 rounded-2xl border border-gray-200 bg-gray-50 p-3 shadow-sm">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                2. Find Products
              </h2>
              <div className="grid gap-2 lg:grid-cols-2">
                <ProductSearch value={search} onChange={setSearch} loading={productsLoading} />
                <BarcodeInput
                  ref={barcodeRef}
                  value={barcode}
                  onChange={setBarcode}
                  onSubmit={(code) => {
                    void handleBarcodeSubmit(code);
                  }}
                  onOpenScanner={() => {
                    if (!warehouseId) {
                      toast.error("Select a warehouse first");
                      return;
                    }
                    setScannerOpen(true);
                  }}
                  loading={barcodeLoading}
                  disabled={!warehouseId}
                />
              </div>
              <div className="mt-2 xl:hidden">
                <Select
                  value={categoryId || ""}
                  onChange={(e) => setCategoryId(e.target.value || null)}
                  className="bg-gray-50"
                >
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <CartItemsPanel
              items={cart}
              onIncrease={increaseQty}
              onDecrease={decreaseQty}
              onRemove={removeItem}
              onClear={clearCart}
            />

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-sm">
              <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-3 py-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  3. Products
                </h2>
                <span className="text-[11px] text-gray-400">Tap a card to add</span>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                <ProductGrid
                  products={products}
                  loading={productsLoading}
                  onAdd={(p) => addProductToCart(p)}
                />
                {totalPages > 1 && (
                  <div className="mt-3 flex justify-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Prev
                    </Button>
                    <span className="self-center text-xs text-gray-500">
                      {page} / {totalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Right: Customer + Current Cart summary */}
          <section className="flex min-h-0 flex-col gap-3 overflow-hidden">
            <div className="shrink-0 rounded-2xl border border-gray-200 bg-gray-50 p-3 shadow-sm">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                4. Customer
              </h2>
              <CustomerSelector
                walkIn={walkIn}
                selectedId={customerId}
                onSelect={setCustomerId}
                canCreate={canCreateCustomer}
              />
            </div>

            <div className="min-h-0 flex-1">
              <PosCart
                items={cart}
                discountType={discountType}
                discountValue={discountValue}
                canApplyDiscount={canDiscount}
                onDiscountTypeChange={setDiscountType}
                onDiscountValueChange={setDiscountValue}
                onCheckout={() => {
                  if (!canCreate) {
                    toast.error("You cannot create sales");
                    return;
                  }
                  setPayOpen(true);
                }}
                onHold={holdSale}
                holding={holding}
              />
            </div>
          </section>
        </main>
      </div>

      <PaymentModal
        isOpen={payOpen}
        grandTotal={grandTotal}
        submitting={submitting}
        onClose={() => setPayOpen(false)}
        onConfirm={completeSale}
      />

      <BarcodeScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={async (code) => {
          const ok = await handleBarcodeSubmit(code, { successToast: true });
          if (ok) setScannerOpen(false);
          return ok;
        }}
      />

      <Receipt
        isOpen={receiptOpen}
        order={completedOrder}
        onClose={() => setReceiptOpen(false)}
        onNewSale={() => {
          setReceiptOpen(false);
          setCompletedOrder(null);
          clearCart();
          requestAnimationFrame(() => barcodeRef.current?.focus());
        }}
      />

      <HeldSalesModal
        isOpen={heldOpen}
        sales={heldSales}
        loading={heldLoading}
        onClose={() => setHeldOpen(false)}
        onResume={resumeHeld}
        onDelete={deleteHeld}
      />

      <RecentSalesModal
        isOpen={recentOpen}
        sales={recentSales}
        loading={recentLoading}
        canUpdate={canUpdatePayment}
        onClose={() => setRecentOpen(false)}
        onRefresh={loadRecentSales}
        onUpdated={(order) => {
          if (!order?.id) return;
          setRecentSales((prev) =>
            prev.map((s) => (s.id === order.id ? { ...s, ...order } : s))
          );
          setCompletedOrder((prev) =>
            prev?.id === order.id ? { ...prev, ...order } : prev
          );
          void loadProducts();
        }}
        onViewReceipt={(sale) => {
          void openRecentSaleReceipt(sale);
        }}
      />
    </div>
  );
}
