"use client";

import { DashboardLayout } from "@/src/components/dashboard-layout";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Loading } from "@/src/components/ui/loading";
import { Modal } from "@/src/components/ui/modal";
import { Pagination } from "@/src/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import type { Customer } from "@/src/lib/api/customers/types";
import { customersApi } from "@/src/lib/api";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Plus, Search, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const pakistaniPhone = z
  .string()
  .regex(/^03\d{9}$/, "Must be exactly 11 digits starting with 03 (e.g. 03001234567)");

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: pakistaniPhone,
  address: z.string().optional(),
  isActive: z.boolean(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function CustomersPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: { isActive: true },
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await customersApi.list({ page, limit: 20, search: search || undefined });
      if (response.data?.success) {
        setCustomers(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const openCreate = () => {
    setEditingCustomer(null);
    reset({ name: "", email: "", phone: "", address: "", isActive: true });
    setShowModal(true);
  };

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    reset({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone,
      address: customer.address || "",
      isActive: customer.isActive,
    });
    setShowModal(true);
  };

  const onSubmit = async (data: CustomerFormData) => {
    setSaving(true);
    try {
      const payload = {
        name: data.name,
        email: data.email || undefined,
        phone: data.phone,
        address: data.address || undefined,
        isActive: data.isActive,
      };

      const response = editingCustomer
        ? await customersApi.update(editingCustomer.id, payload)
        : await customersApi.create(payload);

      if (!response.data || response.error) {
        toast.error("Failed to save customer");
      } else if (!response.data.success) {
        toast.error(response.data.message || "Operation failed");
      } else {
        toast.success(editingCustomer ? "Customer updated" : "Customer created");
        setShowModal(false);
        fetchCustomers();
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;
    setDeleting(true);
    try {
      const response = await customersApi.delete(customerToDelete.id);
      if (!response.data || response.error) {
        toast.error("Failed to delete customer");
      } else if (!response.data.success) {
        toast.error(response.data.message || "Failed to delete customer");
      } else {
        toast.success("Customer deleted");
        setShowDeleteModal(false);
        setCustomerToDelete(null);
        fetchCustomers();
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600">Manage your customer records</p>
          </div>
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Customer
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, phone or email..."
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="outline">Search</Button>
              {search && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setSearch(""); setPage(1); }}
                >
                  Clear
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loading size="lg" />
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{search ? "No customers match your search" : "No customers yet"}</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/customers/${customer.id}`}
                            className="hover:text-blue-600 hover:underline"
                          >
                            {customer.name}
                          </Link>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{customer.phone}</TableCell>
                        <TableCell className="text-gray-600">{customer.email || "—"}</TableCell>
                        <TableCell className="text-gray-500 max-w-xs truncate">
                          {customer.address || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={customer.isActive ? "success" : "default"}>
                            {customer.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(customer)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => confirmDelete(customer)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="mt-4">
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); }}
        title={editingCustomer ? "Edit Customer" : "New Customer"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <Input {...register("name")} placeholder="Customer full name" />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <Input
              {...register("phone")}
              placeholder="03001234567"
              maxLength={11}
              onKeyDown={(e) => {
                if (!/\d/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
                  e.preventDefault();
                }
              }}
            />
            {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>}
            <p className="text-xs text-gray-400 mt-1">11 digits starting with 03 (e.g. 03001234567)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
            <Input {...register("email")} type="email" placeholder="customer@example.com" />
            {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address (optional)</label>
            <textarea
              {...register("address")}
              rows={2}
              placeholder="Street address, city"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" {...register("isActive")} className="h-4 w-4 rounded border-gray-300" />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loading size="sm" /> : editingCustomer ? "Save Changes" : "Create Customer"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Customer"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-900">{customerToDelete?.name}</span>?
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loading size="sm" /> : "Delete"}
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
