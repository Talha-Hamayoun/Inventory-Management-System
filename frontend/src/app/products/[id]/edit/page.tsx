"use client";

import { DashboardLayout } from "@/src/components/dashboard-layout";
import { PageLoading } from "@/src/components/ui/loading";
import { categoriesApi, productsApi } from "@/src/lib/api";
import type { Category, ProductDetail } from "@/src/lib/api/products/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductForm } from "../../_components/product-form";

export default function EditProductPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, categoriesRes] = await Promise.all([
          productsApi.get(params.id as string),
          categoriesApi.list({ page: 1, limit: 100 }),
        ]);

        if (categoriesRes.data?.success)
          setCategories(categoriesRes.data?.data);

        if (productRes.data?.success)
          setProduct(productRes.data?.product as ProductDetail);

      } catch (error) {
        console.error("Failed to fetch product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoading />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {product && (
        <ProductForm
          productId={params.id as string}
          categories={categories}
          initialData={product}
          backUrl={`/products/${params.id}`}
        />
      )}
    </DashboardLayout>
  );
}
