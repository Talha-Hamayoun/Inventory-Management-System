"use client";

import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/utils";
import { ScanLine } from "lucide-react";
import { forwardRef } from "react";

interface BarcodeScanInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export const BarcodeScanInput = forwardRef<HTMLInputElement, BarcodeScanInputProps>(
  function BarcodeScanInput({ value, onChange, onSubmit, disabled, loading }, ref) {
    return (
      <div className="rounded-xl border-2 border-blue-200 bg-blue-50/70 p-4 dark:border-blue-300/40 dark:bg-blue-50/40">
        <label htmlFor="sales-order-barcode" className="mb-2 block text-sm font-semibold text-gray-800">
          Scan or Enter Barcode
        </label>
        <div className="relative">
          <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-600" />
          <Input
            ref={ref}
            id="sales-order-barcode"
            name="barcode-scan"
            value={value}
            disabled={disabled || loading}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            inputMode="numeric"
            placeholder="Type or paste barcode, then press Enter"
            className={cn(
              "h-12 border-blue-200 bg-white pl-10 font-mono text-base tracking-wide",
              "focus:ring-blue-600"
            )}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              e.stopPropagation();
              onSubmit();
            }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Press Enter to add. USB barcode scanners work in this field.
        </p>
      </div>
    );
  }
);
