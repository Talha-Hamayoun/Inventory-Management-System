"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/src/components/dashboard-layout";
import { categoriesApi, warehousesApi } from "@/src/lib/api";
import { ProductForm } from "../_components/product-form";

interface Category {
  id: string;
  name: string;
}

interface Warehouse {
  id: string;
  name: string;
}

export default function NewProductPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const [catRes, whRes] = await Promise.all([
          categoriesApi.list({ page: 1, limit: 100 }),
          warehousesApi.list({ page: 1, limit: 100 }),
        ]);
        if (catRes.data?.success) setCategories(catRes.data.data || []);
        if (whRes.data?.success && Array.isArray(whRes.data.data)) {
          setWarehouses(
            whRes.data.data.map((w: Warehouse) => ({ id: w.id, name: w.name }))
          );
        }
      } catch (error) {
        console.error("Failed to fetch product form data:", error);
      }
    };
    void fetchData();
  }, []);

  return (
    <DashboardLayout>
      <ProductForm categories={categories} warehouses={warehouses} />
    </DashboardLayout>
  );
}
