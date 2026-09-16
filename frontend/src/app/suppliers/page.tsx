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
import type { Supplier } from "@/src/lib/api/suppliers/types";
import { suppliersApi } from "@/src/lib/api";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Edit, Eye, Plus, Search, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  contactName: z.string().optional(),
  email: z.email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  paymentTerms: z.string().optional(),
  leadTimeDays: z.number().int().min(0).optional(),
  notes: z.string().optional(),
  isActive: z.boolean(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

export default function SuppliersPage() {
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showToggleModal, setShowToggleModal] = useState(false);
  const [supplierToToggle, setSupplierToToggle] = useState<Supplier | null>(null);
  const [toggling, setToggling] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      isActive: true,
    },
  });

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await suppliersApi.list({
        page,
        limit: 10,
        search: search || undefined,
      });
      if (!response.data || response.error) {
        console.error("Failed to fetch suppliers:", response.error);
      } else if (response.data.success === false) {
        console.error("Failed to fetch suppliers:", response.data);
      } else {
        setSuppliers(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSuppliers();
  };

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      reset({
        name: supplier.name,
        code: supplier.code,
        contactName: supplier.contactName || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
        city: supplier.city || "",
        country: supplier.country || "",
        paymentTerms: supplier.paymentTerms || "",
        leadTimeDays: supplier.leadTimeDays ?? 0,
        notes: supplier.notes || "",
        isActive: supplier.isActive,
      });
    } else {
      setEditingSupplier(null);
      reset({
        name: "",
        code: "",
        notes: "",
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSupplier(null);
    reset();
  };

  const onSubmit = async (data: SupplierFormData): Promise<void> => {
    setSaving(true);
    try {
      const response = editingSupplier
        ? await suppliersApi.update(editingSupplier.id, data)
        : await suppliersApi.create(data);
      if (!response.data || response.error) {
        console.error("Failed to save supplier:", response.error);
        toast.error("Failed to save supplier");
      } else if (response.data.success === false) {
        console.error("Failed to save supplier:", response.data);
        toast.error(response.data.message || "Failed to save supplier");
      } else {
        toast.success(editingSupplier ? "Supplier updated" : "Supplier created");
        handleCloseModal();
        fetchSuppliers();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setShowDeleteModal(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setSupplierToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!supplierToDelete) return;
    setDeleting(true);
    try {
      const response = await suppliersApi.delete(supplierToDelete.id);
      if (!response.data || response.error) {
        console.error("Failed to delete supplier:", response.error);
        toast.error("Failed to delete supplier");
      } else if (response.data.success === false) {
        console.error("Failed to delete supplier:", response.data);
        toast.error(response.data.message || "Failed to delete supplier");
      } else {
        toast.success("Supplier deleted");
        setShowDeleteModal(false);
        setSupplierToDelete(null);
        fetchSuppliers();
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleClick = (supplier: Supplier) => {
    setSupplierToToggle(supplier);
    setShowToggleModal(true);
  };

  const handleToggleCancel = () => {
    setShowToggleModal(false);
    setSupplierToToggle(null);
  };

  const handleToggleConfirm = async () => {
    if (!supplierToToggle) return;
    setToggling(true);
    try {
      const response = await suppliersApi.toggle(supplierToToggle.id);
      if (!response.data || response.error) {
        console.error("Failed to toggle supplier:", response.error);
        toast.error("Failed to update supplier status");
      } else if (response.data.success === false) {
        console.error("Failed to toggle supplier:", response.data);
        toast.error(response.data.message || "Failed to update supplier status");
      } else {
        toast.success(
          supplierToToggle.isActive
            ? `${supplierToToggle.name} deactivated`
            : `${supplierToToggle.name} activated`
        );
        setShowToggleModal(false);
        setSupplierToToggle(null);
        fetchSuppliers();
      }
    } finally {
      setToggling(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
            <p className="text-gray-600">Manage your supplier relationships</p>
          </div>
          <Button className="gap-2" onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4" />
            Add Supplier
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search suppliers..."
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

        {/* Suppliers Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loading size="lg" />
              </div>
            ) : suppliers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No suppliers found. Add your first supplier to get started.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Lead Time</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            {supplier.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-500">{supplier.code}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{supplier.contactName || "-"}</p>
                            <p className="text-gray-500">{supplier.email || supplier.phone || ""}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {[supplier.city, supplier.country].filter(Boolean).join(", ") || "-"}
                        </TableCell>
                        <TableCell>
                          {supplier.leadTimeDays ? `${supplier.leadTimeDays} days` : "-"}
                        </TableCell>
                        <TableCell>{supplier._count?.purchaseOrders || 0}</TableCell>
                        <TableCell>
                          <Badge variant={supplier.isActive ? "success" : "error"}>
                            {supplier.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Link href={`/suppliers/${supplier.id}`}>
                              <Button variant="ghost" size="sm" title="View details">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleClick(supplier)}
                              title={supplier.isActive ? "Deactivate" : "Activate"}
                            >
                              {supplier.isActive ? (
                                <ToggleRight className="h-4 w-4 text-green-500" />
                              ) : (
                                <ToggleLeft className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenModal(supplier)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(supplier)}
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

      {/* Supplier Form Modal */}
      <Modal isOpen={showModal} onClose={handleCloseModal}>
        <ModalHeader>
          <ModalTitle>
            {editingSupplier ? "Edit Supplier" : "Add Supplier"}
          </ModalTitle>
        </ModalHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <Input {...register("name")} placeholder="Supplier name" />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code *
                </label>
                <Input {...register("code")} placeholder="SUP-001" />
                {errors.code && (
                  <p className="text-sm text-red-500 mt-1">{errors.code.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name
              </label>
              <Input {...register("contactName")} placeholder="Contact person" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input {...register("email")} type="email" placeholder="Email" />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <Input {...register("phone")} placeholder="Phone number" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <Input {...register("address")} placeholder="Street address" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <Input {...register("city")} placeholder="City" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <Input {...register("country")} placeholder="Country" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Terms
                </label>
                <Input {...register("paymentTerms")} placeholder="e.g., Net 30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lead Time (days)
                </label>
                <Input
                  {...register("leadTimeDays", { valueAsNumber: true })}
                  type="number"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                {...register("notes")}
                placeholder="Additional notes about this supplier..."
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
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
              {saving ? <Loading size="sm" /> : editingSupplier ? "Save Changes" : "Create"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={handleDeleteCancel}>
        <ModalHeader>
          <ModalTitle>Delete Supplier</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <p className="text-gray-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-900">{supplierToDelete?.name}</span>?
          </p>
          <p className="text-sm text-gray-500 mt-2">
            This action cannot be undone. Any associated purchase orders will remain in the system.
          </p>
        </ModalContent>
        <ModalFooter>
          <Button variant="outline" onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
            {deleting ? <Loading size="sm" /> : "Delete"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Toggle Status Confirmation Modal */}
      <Modal isOpen={showToggleModal} onClose={handleToggleCancel}>
        <ModalHeader>
          <ModalTitle>
            {supplierToToggle?.isActive ? "Deactivate Supplier" : "Activate Supplier"}
          </ModalTitle>
        </ModalHeader>
        <ModalContent>
          {supplierToToggle?.isActive ? (
            <>
              <p className="text-gray-600">
                Are you sure you want to deactivate{" "}
                <span className="font-semibold text-gray-900">{supplierToToggle?.name}</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Deactivating this supplier will prevent new purchase orders from being created for them.
                Existing orders will not be affected.
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-600">
                Are you sure you want to activate{" "}
                <span className="font-semibold text-gray-900">{supplierToToggle?.name}</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Activating this supplier will allow new purchase orders to be created for them.
              </p>
            </>
          )}
        </ModalContent>
        <ModalFooter>
          <Button variant="outline" onClick={handleToggleCancel} disabled={toggling}>
            Cancel
          </Button>
          <Button
            variant={supplierToToggle?.isActive ? "destructive" : "default"}
            onClick={handleToggleConfirm}
            disabled={toggling}
          >
            {toggling ? (
              <Loading size="sm" />
            ) : supplierToToggle?.isActive ? (
              "Deactivate"
            ) : (
              "Activate"
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
