"use client";

import { DashboardLayout } from "@/src/components/dashboard-layout";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Select } from "@/src/components/ui/select";
import { DataTable } from "@/src/components/ui/data-table";
import { Input } from "@/src/components/ui/input";
import { Loading } from "@/src/components/ui/loading";
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "@/src/components/ui/modal";
import { Pagination } from "@/src/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableIconButton, TableRow, tableIconButtonClass } from "@/src/components/ui/table";
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
            <Button className="gap-2 rounded-xl">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>

        <DataTable
          toolbar={
            <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-50">
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>
              <Select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setPage(1);
                }}
                className="w-48"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
              <Select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="w-40"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
              <Button type="submit" variant="outline" className="gap-2 rounded-xl h-10">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </form>
          }
          banner={
            selectedProductIds.length > 0 ? (
              <div className="flex items-center justify-between px-5 py-2.5 bg-blue-50/80 dark:bg-blue-500/10 border-b border-blue-100 dark:border-blue-500/20">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {selectedProductIds.length} product{selectedProductIds.length === 1 ? "" : "s"} selected
                </span>
                <Button variant="destructive" size="sm" className="gap-2 rounded-lg h-8" onClick={() => setShowBulkDeleteModal(true)}>
                  <Trash2 className="h-4 w-4" />
                  Delete Selected
                </Button>
              </div>
            ) : null
          }
          loading={loading}
          empty={products.length === 0 ? "No products found. Create your first product to get started." : undefined}
          footer={
            products.length > 0 ? (
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            ) : undefined
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <button
                    type="button"
                    aria-label={allProductsSelected ? "Deselect all products" : "Select all products"}
                    onClick={toggleSelectAll}
                    className={`flex h-4.5 w-4.5 items-center justify-center rounded-md border transition-colors ${allProductsSelected ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white hover:border-blue-400"}`}
                  >
                    {allProductsSelected && <Check className="h-3 w-3" />}
                  </button>
                </TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Selling</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const selected = selectedProductIds.includes(product.id);
                return (
                  <TableRow key={product.id} data-state={selected ? "selected" : undefined}>
                    <TableCell>
                      <button
                        type="button"
                        aria-label={`${selected ? "Deselect" : "Select"} ${product.name}`}
                        onClick={() => toggleProductSelection(product.id)}
                        className={`flex h-4.5 w-4.5 items-center justify-center rounded-md border transition-colors ${selected ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white hover:border-blue-400"}`}
                      >
                        {selected && <Check className="h-3 w-3" />}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-44 max-w-64">
                        <p className="font-medium text-gray-900 leading-tight truncate">{product.name}</p>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">{product.productNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex max-w-44 truncate rounded-md bg-gray-100 px-2 py-0.5 font-mono text-[11px] text-gray-600 ring-1 ring-gray-200/70">
                        {product.sku}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-600">{product.category?.name || "—"}</TableCell>
                    <TableCell className="tabular-nums text-gray-600">
                      {product.costPrice != null ? `Rs. ${Number(product.costPrice).toLocaleString()}` : "—"}
                    </TableCell>
                    <TableCell className="tabular-nums font-medium text-gray-900">
                      {product.sellingPrice != null ? `Rs. ${Number(product.sellingPrice).toLocaleString()}` : "—"}
                    </TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
                    <TableCell className="text-gray-400 text-xs whitespace-nowrap">
                      {formatDateTime(product.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end items-center gap-0.5">
                        <Link
                          href={`/products/${product.id}`}
                          aria-label={`View ${product.name}`}
                          className={tableIconButtonClass()}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/products/${product.id}/edit`}
                          aria-label={`Edit ${product.name}`}
                          className={tableIconButtonClass()}
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <TableIconButton
                          tone="danger"
                          aria-label={`Delete ${product.name}`}
                          onClick={() => handleDeleteClick(product)}
                          disabled={deleting === product.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </TableIconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DataTable>
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
