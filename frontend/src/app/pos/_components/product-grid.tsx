"use client";

import type { PosProduct } from "@/src/lib/api/pos";
import { ProductCard } from "./product-card";
import { Loading } from "@/src/components/ui/loading";
import { Package } from "lucide-react";

interface ProductGridProps {
  products: PosProduct[];
  loading?: boolean;
  onAdd: (product: PosProduct) => void;
}

export function ProductGrid({ products, loading, onAdd }: ProductGridProps) {
  if (loading && products.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (!loading && products.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-gray-400">
        <Package className="h-10 w-10 opacity-40" />
        <p className="text-sm font-medium">No products found</p>
        <p className="text-xs">Try another search or category</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onAdd={onAdd} />
      ))}
    </div>
  );
}
