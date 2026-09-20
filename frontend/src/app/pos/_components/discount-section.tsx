"use client";

import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/utils";
import type { DiscountType } from "@/src/lib/api/sales-orders/types";

interface DiscountSectionProps {
  type: DiscountType | null;
  value: number;
  error?: string | null;
  onTypeChange: (type: DiscountType | null) => void;
  onValueChange: (value: number) => void;
}

export function DiscountSection({
  type,
  value,
  error,
  onTypeChange,
  onValueChange,
}: DiscountSectionProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-100 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Discount
      </p>
      <div className="mb-2 flex gap-1.5">
        {(
          [
            { id: null, label: "None" },
            { id: "FIXED" as const, label: "Fixed" },
            { id: "PERCENTAGE" as const, label: "%" },
          ] as const
        ).map((opt) => (
          <button
            key={String(opt.id)}
            type="button"
            onClick={() => {
              onTypeChange(opt.id);
              if (opt.id === null) onValueChange(0);
            }}
            className={cn(
              "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium cursor-pointer",
              type === opt.id
                ? "bg-blue-600 text-white"
                : "bg-gray-50 text-gray-600 hover:bg-gray-200"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {type && (
        <Input
          type="number"
          min={0}
          max={type === "PERCENTAGE" ? 100 : undefined}
          step="0.01"
          value={value || ""}
          onChange={(e) => onValueChange(Number(e.target.value) || 0)}
          placeholder={type === "PERCENTAGE" ? "0–100" : "Amount"}
          className="h-9 bg-gray-50"
        />
      )}
      {error && <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}
