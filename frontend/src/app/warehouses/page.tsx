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
import { warehousesApi } from "@/src/lib/api";
import type { Warehouse } from "@/src/lib/api/warehouses/types";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Plus, Search, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const warehouseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  isActive: z.boolean(),
});

type WarehouseFormData = z.infer<typeof warehouseSchema>;

export default function WarehousesPage() {
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [warehouseToToggle, setWarehouseToToggle] = useState<Warehouse | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState<Warehouse | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      isActive: true,
    },
  });

  const fetchWarehouses = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await warehousesApi.list({
        page,
        limit: 10,
        search: search || undefined,
      });
      if (response.data && response.data.success === true) {
        setWarehouses(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch warehouses:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setPage(1);
    fetchWarehouses();
  };

  const handleOpenModal = (warehouse?: Warehouse): void => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      reset({ name: warehouse.name, address: warehouse.address, isActive: warehouse.isActive });
    } else {
      setEditingWarehouse(null);
      reset({ name: "", address: "", isActive: true });
    }
    setShowModal(true);
  };

  const handleCloseModal = (): void => {
    setShowModal(false);
    setEditingWarehouse(null);
    reset();
  };

  const onSubmit = async (data: WarehouseFormData): Promise<void> => {
    setSaving(true);
    try {
      const response = editingWarehouse
        ? await warehousesApi.update(editingWarehouse.id, data)
        : await warehousesApi.create(data);
      if (response.data && response.data.success === true) {
        toast.success(editingWarehouse ? "Warehouse updated" : "Warehouse created");
        handleCloseModal();
        fetchWarehouses();
      } else if (response.data && response.data.success === false) {
        toast.error(response.data.message || "Failed to save warehouse");
      } else {
        toast.error("Failed to save warehouse");
      }
    } catch (error) {
      console.error("Failed to save warehouse:", error);
      toast.error("Failed to save warehouse");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleClick = (warehouse: Warehouse): void => {
    setWarehouseToToggle(warehouse);
    setShowToggleModal(true);
  };

  const handleToggleCancel = (): void => {
    setShowToggleModal(false);
    setWarehouseToToggle(null);
  };

  const handleToggleConfirm = async (): Promise<void> => {
    if (!warehouseToToggle) return;
    setToggling(warehouseToToggle.id);
    setShowToggleModal(false);
    try {
      const response = await warehousesApi.toggle(warehouseToToggle.id);
      if (response.data && response.data.success === true) {
        toast.success(warehouseToToggle.isActive ? "Warehouse deactivated" : "Warehouse activated");
        fetchWarehouses();
      } else if (response.data && response.data.success === false) {
        toast.error(response.data.message || "Failed to update status");
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("Failed to toggle warehouse status:", error);
      toast.error("Failed to update status");
    } finally {
      setToggling(null);
      setWarehouseToToggle(null);
    }
  };

  const handleDeleteClick = (warehouse: Warehouse): void => {
    setWarehouseToDelete(warehouse);
    setShowDeleteModal(true);
  };

  const handleDeleteCancel = (): void => {
    setShowDeleteModal(false);
    setWarehouseToDelete(null);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!warehouseToDelete) return;
    setDeleting(warehouseToDelete.id);
    setShowDeleteModal(false);
    try {
      const response = await warehousesApi.delete(warehouseToDelete.id);
      if (response.data && response.data.success === true) {
        toast.success("Warehouse deleted");
        fetchWarehouses();
      } else if (response.data && response.data.success === false) {
        toast.error(response.data.message || "Failed to delete warehouse");
      } else {
        toast.error("Failed to delete warehouse");
      }
    } catch (error) {
      console.error("Failed to delete warehouse:", error);
      toast.error("Failed to delete warehouse");
    } finally {
      setDeleting(null);
      setWarehouseToDelete(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
            <p className="text-gray-600">Manage your warehouse locations</p>
          </div>
          <Button className="gap-2" onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4" />
            Add Warehouse
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search warehouses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button type="submit" variant="outline" className="gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Warehouses Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loading size="lg" />
              </div>
            ) : warehouses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No warehouses found. Create your first warehouse to get started.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Stock Items</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {warehouses.map((warehouse) => (
                      <TableRow key={warehouse.id}>
                        <TableCell className="font-medium">{warehouse.name}</TableCell>
                        <TableCell className="text-gray-500">{warehouse.address}</TableCell>
                        <TableCell className="text-gray-500">
                          {warehouse._count?.inventoryItems ?? 0}
                        </TableCell>
                        <TableCell>
                          <Badge variant={warehouse.isActive ? "success" : "error"}>
                            {warehouse.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleClick(warehouse)}
                              disabled={toggling === warehouse.id}
                              title={warehouse.isActive ? "Deactivate" : "Activate"}
                            >
                              {warehouse.isActive ? (
                                <ToggleRight className="h-4 w-4 text-green-500" />
                              ) : (
                                <ToggleLeft className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenModal(warehouse)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(warehouse)}
                              disabled={deleting === warehouse.id}
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

      {/* Warehouse Form Modal */}
      <Modal isOpen={showModal} onClose={handleCloseModal}>
        <ModalHeader>
          <ModalTitle>
            {editingWarehouse ? "Edit Warehouse" : "Add Warehouse"}
          </ModalTitle>
        </ModalHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <Input {...register("name")} placeholder="Warehouse name" />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <Input {...register("address")} placeholder="Street address" />
              {errors.address && (
                <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("isActive")}
                className="rounded border-gray-300"
              />
              <label className="text-sm text-gray-700">Active</label>
            </div>
          </ModalContent>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loading size="sm" /> : editingWarehouse ? "Save Changes" : "Create"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Toggle Status Confirmation Modal */}
      <Modal isOpen={showToggleModal} onClose={handleToggleCancel}>
        <ModalHeader>
          <ModalTitle>
            {warehouseToToggle?.isActive ? "Deactivate Warehouse" : "Activate Warehouse"}
          </ModalTitle>
        </ModalHeader>
        <ModalContent>
          {warehouseToToggle?.isActive ? (
            <div className="space-y-2">
              <p className="text-gray-600">
                Are you sure you want to deactivate{" "}
                <span className="font-semibold text-gray-900">{warehouseToToggle?.name}</span>?
              </p>
              <p className="text-sm text-gray-500">
                Deactivating this warehouse will prevent it from being used in new inventory operations. Existing stock and records will remain intact.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-600">
                Are you sure you want to activate{" "}
                <span className="font-semibold text-gray-900">{warehouseToToggle?.name}</span>?
              </p>
              <p className="text-sm text-gray-500">
                Activating this warehouse will allow it to receive inventory and be used in operations again.
              </p>
            </div>
          )}
        </ModalContent>
        <ModalFooter>
          <Button variant="outline" onClick={handleToggleCancel}>
            Cancel
          </Button>
          <Button
            variant={warehouseToToggle?.isActive ? "destructive" : "default"}
            onClick={handleToggleConfirm}
          >
            {warehouseToToggle?.isActive ? "Deactivate" : "Activate"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={handleDeleteCancel}>
        <ModalHeader>
          <ModalTitle>Delete Warehouse</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <p className="text-gray-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold">{warehouseToDelete?.name}</span>? This action cannot be undone.
          </p>
        </ModalContent>
        <ModalFooter>
          <Button variant="outline" onClick={handleDeleteCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
