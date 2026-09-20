"use client";

import { Button } from "@/src/components/ui/button";
import type { PosCartItem } from "@/src/lib/api/pos";
import type { DiscountType } from "@/src/lib/api/sales-orders/types";
import { resolveDiscount } from "@/src/lib/sales-order-discount";
import { DiscountSection } from "./discount-section";
import { ShoppingCart } from "lucide-react";

function formatMoney(value: number) {
  return `Rs ${value.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

interface PosCartProps {
  items: PosCartItem[];
  discountType: DiscountType | null;
  discountValue: number;
  canApplyDiscount: boolean;
  onDiscountTypeChange: (type: DiscountType | null) => void;
  onDiscountValueChange: (value: number) => void;
  onCheckout: () => void;
  onHold: () => void;
  holding?: boolean;
}

export function PosCart({
  items,
  discountType,
  discountValue,
  canApplyDiscount,
  onDiscountTypeChange,
  onDiscountValueChange,
  onCheckout,
  onHold,
  holding,
}: PosCartProps) {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discount = resolveDiscount(subtotal, discountType, discountValue);
  const tax = 0;
  const grandTotal = Math.max(0, discount.invoiceTotal + tax);
  const pieceCount = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-sm">
      <div className="shrink-0 border-b border-gray-100 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">5. Cart & Pay</p>
        <div className="mt-0.5 flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-900">Current Cart</h3>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
            {pieceCount}
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {pieceCount === 0
            ? "Items appear above Products"
            : `${pieceCount} pcs · ${items.length} lines`}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        {canApplyDiscount && (
          <DiscountSection
            type={discountType}
            value={discountValue}
            error={discount.error}
            onTypeChange={onDiscountTypeChange}
            onValueChange={onDiscountValueChange}
          />
        )}

        <div className="mt-auto space-y-1.5 rounded-xl border border-gray-200 bg-gray-100 px-3 py-3 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span className="font-medium text-gray-900">{formatMoney(subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Discount</span>
            <span className="font-medium text-rose-600 dark:text-rose-400">
              −{formatMoney(discount.discountAmount)}
            </span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax</span>
            <span className="font-medium text-gray-900">{formatMoney(tax)}</span>
          </div>
          <div className="flex justify-between border-t border-dashed border-gray-200 pt-2 text-base font-bold text-gray-900">
            <span>Grand Total</span>
            <span className="text-blue-700 dark:text-blue-400">{formatMoney(grandTotal)}</span>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={items.length === 0 || holding}
            onClick={onHold}
          >
            Hold Sale
          </Button>
          <Button
            type="button"
            disabled={items.length === 0 || !!discount.error}
            onClick={onCheckout}
            className="h-11 bg-blue-600 text-sm font-semibold hover:bg-blue-700 sm:text-base"
          >
            Pay / Checkout
            <span className="ml-1 text-[10px] font-normal opacity-80">F8</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
