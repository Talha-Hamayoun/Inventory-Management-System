"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/src/components/dashboard-layout";
import { categoriesApi } from "@/src/lib/api";
import { ProductForm } from "../_components/product-form";

interface Category {
  id: string;
  name: string;
}

export default function NewProductPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async (): Promise<void> => {
      try {
        const response = await categoriesApi.list({ page: 1, limit: 100 });
        if (response.data?.success)
          setCategories(response.data?.data);
        else
          console.error("Failed to fetch categories:", response);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <DashboardLayout>
      <ProductForm categories={categories} />
    </DashboardLayout>
  );
}
