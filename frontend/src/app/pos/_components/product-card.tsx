"use client";

import { cn } from "@/src/lib/utils";
import type { PosProduct } from "@/src/lib/api/pos";
import { Package } from "lucide-react";

function formatMoney(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return `Rs ${n.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

interface ProductCardProps {
  product: PosProduct;
  onAdd: (product: PosProduct) => void;
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const price = Number(product.sellingPrice ?? 0);
  const disabled = product.outOfStock || product.availableQuantity <= 0;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onAdd(product)}
      className={cn(
        "group flex flex-col rounded-xl border border-gray-200 bg-gray-100 p-2.5 text-left shadow-sm transition-all",
        disabled
          ? "cursor-not-allowed opacity-55"
          : "cursor-pointer hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
      )}
    >
      <div className="mb-2 flex h-12 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
        <Package className="h-6 w-6" />
      </div>
      <p className="line-clamp-2 min-h-9 text-sm font-semibold leading-snug text-gray-900">
        {product.name}
      </p>
      <p className="mt-0.5 truncate font-mono text-[11px] text-gray-500">
        {product.sku || product.barcode || "—"}
      </p>
      {product.category?.name && (
        <p className="mt-0.5 truncate text-[11px] text-gray-400">{product.category.name}</p>
      )}
      <div className="mt-auto flex items-end justify-between gap-2 pt-2">
        <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{formatMoney(price)}</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            disabled
              ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
              : product.availableQuantity <= 5
                ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
          )}
        >
          {disabled ? "Out of Stock" : `Stock ${product.availableQuantity}`}
        </span>
      </div>
    </button>
  );
}
