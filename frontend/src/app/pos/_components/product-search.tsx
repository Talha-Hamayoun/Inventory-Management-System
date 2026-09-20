"use client";

import { Input } from "@/src/components/ui/input";
import { Search } from "lucide-react";

interface ProductSearchProps {
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
}

export function ProductSearch({ value, onChange, loading }: ProductSearchProps) {
  return (
    <div className="flex h-full flex-col justify-end rounded-xl border border-gray-200 bg-gray-100 p-2.5">
      <label
        htmlFor="pos-product-search"
        className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600"
      >
        <Search className="h-3.5 w-3.5" />
        Search
        <span className="ml-auto font-normal normal-case tracking-normal text-gray-400">F2</span>
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          id="pos-product-search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Name, SKU or barcode…"
          className="h-10 bg-gray-50 pl-9"
          autoComplete="off"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">
            Searching…
          </span>
        )}
      </div>
    </div>
  );
}
