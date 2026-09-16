"use client";

import { DashboardLayout } from "@/src/components/dashboard-layout";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { PageLoading } from "@/src/components/ui/loading";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { productsApi } from "@/src/lib/api";
import { formatDateTime } from "@/src/lib/utils";
import type { ProductDetail } from "@/src/lib/api/products/types";
import { ArrowLeft, Edit, Package } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProductDetailPage() {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await productsApi.get(params.id as string);
        if (!response.data || response.error || !response.status) {
          console.error("Product not found:", response);
          router.push("/products");
        } else if (response.data.success === false) {
          console.error("Failed to fetch product:", response.data.message);
          router.push("/products");
        } else {
          setProduct(response.data.product);
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
        router.push("/products");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [params.id, router]);

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoading />
      </DashboardLayout>
    );
  }

  if (!product) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Product not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "success" | "warning" | "error" | "default"> = {
      ACTIVE: "success",
      INACTIVE: "warning",
      ARCHIVED: "default",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getTotalStock = () => {
    return product.inventoryItems?.reduce((sum, item) => sum + item.availableQuantity, 0) || 0;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/products" className="cursor-pointer">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-gray-600">SKU: {product.sku || "N/A"}</p>
            </div>
          </div>
          <Link href={`/products/${product.id}/edit`} className="cursor-pointer">
            <Button className="gap-2">
              <Edit className="h-4 w-4" />
              Edit Product
            </Button>
          </Link>
        </div>

        {/* Product Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Unit of Measure</p>
                  <p className="font-semibold">{product.unitOfMeasure}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-1">{getStatusBadge(product.status)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-semibold">{product.category?.name || "Uncategorized"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        {product.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">SKU</p>
                <p className="font-semibold">{product.sku || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Barcode</p>
                <p className="font-semibold">{product.barcode || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cost Price</p>
                <p className="font-semibold">{product.costPrice != null ? `Rs. ${Number(product.costPrice).toLocaleString()}` : "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Selling Price</p>
                <p className="font-semibold">{product.sellingPrice != null ? `Rs. ${Number(product.sellingPrice).toLocaleString()}` : "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Stock</p>
                <Badge variant={getTotalStock() > 0 ? "success" : "error"}>
                  {getTotalStock()} {product.unitOfMeasure}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                {getStatusBadge(product.status)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory by Warehouse */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory by Warehouse</CardTitle>
          </CardHeader>
          <CardContent>
            {product.inventoryItems && product.inventoryItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Available</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.inventoryItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.warehouse.name}</TableCell>
                      <TableCell>{item.availableQuantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-gray-500 text-center py-4">No inventory records found</p>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-8 text-sm text-gray-500">
              <p>Created: {formatDateTime(product.createdAt)}</p>
              <p>Updated: {formatDateTime(product.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
