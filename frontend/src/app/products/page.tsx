"use client";

import { DashboardLayout } from "@/src/components/dashboard-layout";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Loading } from "@/src/components/ui/loading";
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "@/src/components/ui/modal";
import { Pagination } from "@/src/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { categoriesApi, productsApi } from "@/src/lib/api";
import { toast } from "sonner";
import { formatDateTime } from "@/src/lib/utils";
import type { Category, ProductListItem } from "@/src/lib/api/products/types";
import { Check, Edit, Eye, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function ProductsPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductListItem | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchProducts = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search: search || undefined,
        categoryId: categoryId || undefined,
        status: status || undefined,
      };
      const response = await productsApi.list(params);
      if (response.data && response.data.success === true) {
        setProducts(response.data.data || []);
        setSelectedProductIds([]);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryId, status]);

  const fetchCategories = async (): Promise<void> => {
    try {
      const response = await categoriesApi.list({ page: 1, limit: 100 });
      if (response.data && response.data.success === true) {
        setCategories(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleDeleteClick = (product: ProductListItem): void => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleDeleteCancel = (): void => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!productToDelete) return;

    setDeleting(productToDelete.id);
    try {
      const response = await productsApi.delete(productToDelete.id);
      if (!response.data || response.error) {
        console.error("Failed to delete product:", response.error);
        toast.error("Failed to delete product");
      } else if (response.data.success === false) {
        console.error("Failed to delete product:", response.data);
        toast.error(response.data.message || "Failed to delete product");
      } else {
        toast.success("Product deleted");
        handleDeleteCancel();
        fetchProducts();
      }
    } finally {
      setDeleting(null);
    }
  };

  const allProductsSelected = products.length > 0 && products.every((product) => selectedProductIds.includes(product.id));

  const toggleProductSelection = (id: string): void => {
    setSelectedProductIds((current) => current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]);
  };

  const toggleSelectAll = (): void => {
    setSelectedProductIds(allProductsSelected ? [] : products.map((product) => product.id));
  };

  const handleBulkDeleteConfirm = async (): Promise<void> => {
    if (selectedProductIds.length === 0) return;

    setBulkDeleting(true);
    try {
      const response = await productsApi.bulkDelete(selectedProductIds);
      if (!response.data || response.error || response.data.success === false) {
        toast.error(response.data?.message || "Failed to delete products");
        return;
      }

      toast.success(response.data.message || "Products deleted");
      setShowBulkDeleteModal(false);
      setSelectedProductIds([]);
      fetchProducts();
    } finally {
      setBulkDeleting(false);
    }
  };

  const getStatusBadge = (productStatus: string) => {
    const variants: Record<string, "success" | "warning" | "error" | "default"> = {
      ACTIVE: "success",
      INACTIVE: "warning",
      ARCHIVED: "default",
    };
    return <Badge variant={variants[productStatus] || "default"}>{productStatus}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600">Manage your product catalog</p>
          </div>
          <Link href="/products/new" className="cursor-pointer">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-50">
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setPage(1);
                }}
                className="w-48 flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="w-40 flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              <Button type="submit" variant="outline" className="gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardContent className="pt-6">
            {selectedProductIds.length > 0 && (
              <div className="mb-4 flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3">
                <span className="text-sm font-medium text-red-800">
                  {selectedProductIds.length} product{selectedProductIds.length === 1 ? "" : "s"} selected
                </span>
                <Button variant="destructive" size="sm" className="gap-2" onClick={() => setShowBulkDeleteModal(true)}>
                  <Trash2 className="h-4 w-4" />
                  Delete Selected
                </Button>
              </div>
            )}
            {loading ? (
              <div className="flex justify-center py-8">
                <Loading size="lg" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No products found. Create your first product to get started.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <button
                          type="button"
                          aria-label={allProductsSelected ? "Deselect all products" : "Select all products"}
                          onClick={toggleSelectAll}
                          className={`flex h-5 w-5 items-center justify-center rounded border ${allProductsSelected ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white"}`}
                        >
                          {allProductsSelected && <Check className="h-3.5 w-3.5" />}
                        </button>
                      </TableHead>
                      <TableHead>Product #</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Cost Price</TableHead>
                      <TableHead>Selling Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <button
                            type="button"
                            aria-label={`${selectedProductIds.includes(product.id) ? "Deselect" : "Select"} ${product.name}`}
                            onClick={() => toggleProductSelection(product.id)}
                            className={`flex h-5 w-5 items-center justify-center rounded border ${selectedProductIds.includes(product.id) ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white"}`}
                          >
                            {selectedProductIds.includes(product.id) && <Check className="h-3.5 w-3.5" />}
                          </button>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-gray-500">{product.productNumber}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-gray-500">{product.sku}</TableCell>
                        <TableCell>{product.category?.name || "-"}</TableCell>
                        <TableCell className="text-gray-700">{product.costPrice != null ? `Rs. ${Number(product.costPrice).toLocaleString()}` : "-"}</TableCell>
                        <TableCell className="text-gray-700">{product.sellingPrice != null ? `Rs. ${Number(product.sellingPrice).toLocaleString()}` : "-"}</TableCell>
                        <TableCell>{getStatusBadge(product.status)}</TableCell>
                        <TableCell className="text-gray-500">
                          {formatDateTime(product.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Link href={`/products/${product.id}`} className="cursor-pointer">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/products/${product.id}/edit`} className="cursor-pointer">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(product)}
                              disabled={deleting === product.id}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4">
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={handleDeleteCancel}>
        <ModalHeader>
          <ModalTitle>Delete Product</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <p className="text-gray-600">
            Are you sure you want to delete <span className="font-semibold text-gray-900">{productToDelete?.name}</span>? This action cannot be undone.
          </p>
        </ModalContent>
        <ModalFooter>
          <Button type="button" variant="outline" onClick={handleDeleteCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteConfirm}
            disabled={!!deleting}
          >
            {deleting ? <Loading size="sm" /> : "Delete"}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={showBulkDeleteModal} onClose={() => !bulkDeleting && setShowBulkDeleteModal(false)}>
        <ModalHeader>
          <ModalTitle>Delete Selected Products</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <p className="text-gray-600">
            Are you sure you want to delete <span className="font-semibold text-gray-900">{selectedProductIds.length} selected product{selectedProductIds.length === 1 ? "" : "s"}</span>? This action cannot be undone.
          </p>
        </ModalContent>
        <ModalFooter>
          <Button type="button" variant="outline" onClick={() => setShowBulkDeleteModal(false)} disabled={bulkDeleting}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleBulkDeleteConfirm} disabled={bulkDeleting}>
            {bulkDeleting ? <Loading size="sm" /> : "Delete Selected"}
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
