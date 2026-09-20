"use client";

import { Button } from "@/src/components/ui/button";
import type { PosCartItem } from "@/src/lib/api/pos";
import { Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/src/lib/utils";

function formatMoney(value: number) {
  return `Rs ${value.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

interface CartItemProps {
  item: PosCartItem;
  variant?: "card" | "row";
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
  onRemove: (productId: string) => void;
}

export function CartItem({
  item,
  variant = "card",
  onIncrease,
  onDecrease,
  onRemove,
}: CartItemProps) {
  const lineTotal = item.unitPrice * item.quantity;
  const atMax = item.quantity >= item.availableQuantity;

  if (variant === "row") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-2.5 py-1.5 shadow-sm">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
          <p className="truncate font-mono text-[11px] text-gray-500">
            {item.sku || "—"} · {formatMoney(item.unitPrice)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7 bg-gray-50"
            onClick={() => onDecrease(item.productId)}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-7 text-center text-sm font-bold tabular-nums text-gray-900">
            {item.quantity}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7 bg-gray-50"
            disabled={atMax}
            onClick={() => onIncrease(item.productId)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <span className="w-[4.5rem] shrink-0 text-right text-sm font-bold text-blue-600 dark:text-blue-400">
          {formatMoney(lineTotal)}
        </span>

        <button
          type="button"
          onClick={() => onRemove(item.productId)}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/15 cursor-pointer"
          aria-label={`Remove ${item.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-gray-200 bg-gray-50 p-3")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
          <p className="font-mono text-[11px] text-gray-500">{item.sku || "—"}</p>
          <p className="mt-1 text-xs text-gray-500">{formatMoney(item.unitPrice)} each</p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(item.productId)}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/15 cursor-pointer"
          aria-label={`Remove ${item.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onDecrease(item.productId)}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className="w-8 text-center text-sm font-semibold tabular-nums text-gray-900">
            {item.quantity}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={atMax}
            onClick={() => onIncrease(item.productId)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <span className="text-sm font-bold text-gray-900">{formatMoney(lineTotal)}</span>
      </div>
      {atMax && <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">Max stock reached</p>}
    </div>
  );
}
