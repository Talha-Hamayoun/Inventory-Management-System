"use client";

import { Button } from "@/src/components/ui/button";
import type { PosCartItem } from "@/src/lib/api/pos";
import { CartItem } from "./cart-item";
import { ShoppingCart } from "lucide-react";

interface CartItemsPanelProps {
  items: PosCartItem[];
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
}

export function CartItemsPanel({
  items,
  onIncrease,
  onDecrease,
  onRemove,
  onClear,
}: CartItemsPanelProps) {
  const pieceCount = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="shrink-0 overflow-hidden rounded-2xl border border-blue-200 bg-gray-50 shadow-sm dark:border-blue-500/30">
      <div className="flex items-center justify-between gap-2 border-b border-blue-100 bg-blue-50/80 px-3 py-2 dark:border-blue-500/20 dark:bg-blue-500/10">
        <div className="flex min-w-0 items-center gap-2">
          <ShoppingCart className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-600">
            Cart Items
          </h2>
          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white">
            {pieceCount === 0 ? "0" : `${pieceCount} pcs`}
          </span>
          {items.length > 0 && (
            <span className="hidden text-[11px] text-gray-500 sm:inline">
              {items.length} lines
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={items.length === 0}
          onClick={onClear}
          className="h-7 shrink-0 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/15 disabled:opacity-40"
        >
          Clear
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-3.5 text-gray-400">
          <ShoppingCart className="h-5 w-5 shrink-0 opacity-35" />
          <p className="text-sm">No items yet — tap a product below to add</p>
        </div>
      ) : (
        <div className="max-h-36 space-y-1.5 overflow-y-auto p-2 sm:max-h-44">
          {items.map((item) => (
            <CartItem
              key={item.productId}
              item={item}
              variant="row"
              onIncrease={onIncrease}
              onDecrease={onDecrease}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
