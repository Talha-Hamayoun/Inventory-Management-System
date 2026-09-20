"use client";

import { cn } from "@/src/lib/utils";

interface CategoryFilterProps {
  categories: { id: string; name: string }[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryFilter({ categories, selectedId, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex flex-col gap-1 overflow-y-auto pr-0.5">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors cursor-pointer",
          selectedId === null
            ? "bg-blue-600 text-white shadow-sm"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        )}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelect(cat.id)}
          className={cn(
            "rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors cursor-pointer truncate",
            selectedId === cat.id
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
          title={cat.name}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
