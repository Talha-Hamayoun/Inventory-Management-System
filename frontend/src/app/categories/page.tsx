"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/src/components/dashboard-layout";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/src/components/ui/table";
import { Pagination } from "@/src/components/ui/pagination";
import { Loading } from "@/src/components/ui/loading";
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from "@/src/components/ui/modal";
import { categoriesApi } from "@/src/lib/api";
import type { Category } from "@/src/lib/api/categories/types";
import { toast } from "sonner";
import { Check, Plus, Edit, Trash2, FolderTree } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  parentId: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function CategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  const fetchCategories = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await categoriesApi.list({ page, limit: 10 });
      if (response.data?.success) {
        setCategories(response.data?.data);
        setSelectedCategoryIds([]);
        setTotalPages(response.data?.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchAllCategories = async () => {
    try {
      const response = await categoriesApi.list({ page: 1, limit: 100 });
      if (response.data?.success)
        setAllCategories(response.data?.data);
      else
        console.error("Failed to fetch all categories:", response);
    } catch (error) {
      console.error("Failed to fetch all categories:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenModal = (category?: Category) => {
    fetchAllCategories();
    if (category) {
      setEditingCategory(category);
      reset({
        name: category.name,
        description: category.description || "",
        parentId: category.parent?.id || "",
      });
    } else {
      setEditingCategory(null);
      reset({
        name: "",
        description: "",
        parentId: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    reset();
  };

  const onSubmit = async (data: CategoryFormData): Promise<void> => {
    setSaving(true);
    try {
      const response = editingCategory
        ? await categoriesApi.update(editingCategory.id, data)
        : await categoriesApi.create(data);
      if (!response.data || response.error) {
        console.error("Failed to save category:", response.error);
        toast.error("Failed to save category");
      } else if (response.data.success === false) {
        console.error("Failed to save category:", response.data);
        toast.error(response.data.message || "Failed to save category");
      } else {
        toast.success(editingCategory ? "Category updated" : "Category created");
        handleCloseModal();
        fetchCategories();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (category: Category): void => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const handleDeleteCancel = (): void => {
    setShowDeleteModal(false);
    setCategoryToDelete(null);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!categoryToDelete) return;

    setDeleting(categoryToDelete.id);
    try {
      const response = await categoriesApi.delete(categoryToDelete.id);
      if (!response.data || response.error) {
        console.error("Failed to delete category:", response.error);
        toast.error("Failed to delete category");
      } else if (response.data.success === false) {
        console.error("Failed to delete category:", response.data);
        toast.error(response.data.message || "Failed to delete category");
      } else {
        toast.success("Category deleted");
        handleDeleteCancel();
        fetchCategories();
      }
    } finally {
      setDeleting(null);
    }
  };

  const allCategoriesSelected = categories.length > 0 && categories.every((category) => selectedCategoryIds.includes(category.id));

  const toggleCategorySelection = (id: string): void => {
    setSelectedCategoryIds((current) => current.includes(id)
      ? current.filter((selectedId) => selectedId !== id)
      : [...current, id]);
  };

  const toggleSelectAll = (): void => {
    setSelectedCategoryIds(allCategoriesSelected ? [] : categories.map((category) => category.id));
  };

  const handleBulkDeleteConfirm = async (): Promise<void> => {
    if (selectedCategoryIds.length === 0) return;

    setBulkDeleting(true);
    try {
      const response = await categoriesApi.bulkDelete(selectedCategoryIds);
      if (!response.data || response.error || response.data.success === false) {
        toast.error(response.data?.message || "Failed to delete categories");
        return;
      }

      toast.success(response.data.message || "Categories deleted");
      setShowBulkDeleteModal(false);
      setSelectedCategoryIds([]);
      fetchCategories();
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600">Organize your products into categories</p>
          </div>
          <Button className="gap-2" onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </div>

        {/* Categories Table */}
        <Card>
          <CardContent className="pt-6">
            {selectedCategoryIds.length > 0 && (
              <div className="mb-4 flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3">
                <span className="text-sm font-medium text-red-800">
                  {selectedCategoryIds.length} categor{selectedCategoryIds.length === 1 ? "y" : "ies"} selected
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
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FolderTree className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No categories found. Create your first category to get started.</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <button
                          type="button"
                          aria-label={allCategoriesSelected ? "Deselect all categories" : "Select all categories"}
                          onClick={toggleSelectAll}
                          className={`flex h-5 w-5 items-center justify-center rounded border ${allCategoriesSelected ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white"}`}
                        >
                          {allCategoriesSelected && <Check className="h-3.5 w-3.5" />}
                        </button>
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Subcategories</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <button
                            type="button"
                            aria-label={`${selectedCategoryIds.includes(category.id) ? "Deselect" : "Select"} ${category.name}`}
                            onClick={() => toggleCategorySelection(category.id)}
                            className={`flex h-5 w-5 items-center justify-center rounded border ${selectedCategoryIds.includes(category.id) ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white"}`}
                          >
                            {selectedCategoryIds.includes(category.id) && <Check className="h-3.5 w-3.5" />}
                          </button>
                        </TableCell>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>
                          {category.parent ? (
                            <Badge variant="default">{category.parent.name}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-gray-500">
                          {category.description || "-"}
                        </TableCell>
                        <TableCell>{category._count?.products || 0}</TableCell>
                        <TableCell>{category._count?.children || 0}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenModal(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(category)}
                              disabled={deleting === category.id}
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
          <ModalTitle>Delete Category</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <p className="text-gray-600">
            Are you sure you want to delete <span className="font-semibold text-gray-900">{categoryToDelete?.name}</span>? This action cannot be undone.
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
          <ModalTitle>Delete Selected Categories</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <p className="text-gray-600">
            Are you sure you want to delete <span className="font-semibold text-gray-900">{selectedCategoryIds.length} selected categor{selectedCategoryIds.length === 1 ? "y" : "ies"}</span>? Categories with products or subcategories cannot be deleted.
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

      {/* Category Modal */}
      <Modal isOpen={showModal} onClose={handleCloseModal}>
        <ModalHeader>
          <ModalTitle>
            {editingCategory ? "Edit Category" : "Add Category"}
          </ModalTitle>
        </ModalHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <Input {...register("name")} placeholder="Category name" />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Category
              </label>
              <select {...register("parentId")} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50">
                <option value="">No parent (top-level)</option>
                {allCategories
                  .filter((c) => c.id !== editingCategory?.id)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register("description")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Category description"
              />
            </div>
          </ModalContent>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loading size="sm" /> : editingCategory ? "Save Changes" : "Create"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
