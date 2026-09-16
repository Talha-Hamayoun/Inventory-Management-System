"use client";

import { DashboardLayout } from "@/src/components/dashboard-layout";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Loading } from "@/src/components/ui/loading";
import { Modal } from "@/src/components/ui/modal";
import type { Customer } from "@/src/lib/api/customers/types";
import { customersApi } from "@/src/lib/api";
import { formatDateTime } from "@/src/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Edit, Mail, MapPin, Phone, Trash2, User } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({ resolver: zodResolver(customerSchema) });

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const response = await customersApi.get(id);
      if (response.data?.success) {
        setCustomer(response.data.data);
      } else {
        toast.error("Customer not found");
        router.push("/customers");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const openEdit = () => {
    if (!customer) return;
    reset({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone,
      address: customer.address || "",
      isActive: customer.isActive,
    });
    setShowEditModal(true);
  };

  const onSubmit = async (data: CustomerFormData) => {
    if (!customer) return;
    setSaving(true);
    try {
      const response = await customersApi.update(customer.id, {
        name: data.name,
        email: data.email || undefined,
        phone: data.phone,
        address: data.address || undefined,
        isActive: data.isActive,
      });
      if (!response.data || response.error) {
        toast.error("Failed to update customer");
      } else if (!response.data.success) {
        toast.error(response.data.message || "Failed to update customer");
      } else {
        toast.success("Customer updated");
        setShowEditModal(false);
        setCustomer(response.data.data);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!customer) return;
    setDeleting(true);
    try {
      const response = await customersApi.delete(customer.id);
      if (!response.data || response.error) {
        toast.error("Failed to delete customer");
      } else if (!response.data.success) {
        toast.error(response.data.message || "Failed to delete customer");
      } else {
        toast.success("Customer deleted");
        router.push("/customers");
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-16"><Loading size="lg" /></div>
      </DashboardLayout>
    );
  }

  if (!customer) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/customers">
              <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
              <p className="text-gray-500 text-sm">Customer #{customer.id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={openEdit}>
              <Edit className="h-4 w-4" />Edit
            </Button>
            <Button
              variant="outline"
              className="gap-2 text-red-600 border-red-200 hover:border-red-300 hover:text-red-700"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="h-4 w-4" />Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-500" />Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="font-mono font-medium">{customer.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  {customer.email ? (
                    <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                      {customer.email}
                    </a>
                  ) : (
                    <p className="text-gray-400">Not provided</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Address</p>
                  <p className={customer.address ? "text-gray-700" : "text-gray-400"}>
                    {customer.address || "Not provided"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Account Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-gray-400">Status</p>
                <Badge variant={customer.isActive ? "success" : "default"} className="mt-1">
                  {customer.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-400">Customer Since</p>
                <p className="text-sm text-gray-700">{formatDateTime(customer.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Last Updated</p>
                <p className="text-sm text-gray-700">{formatDateTime(customer.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Customer">
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
            <input type="checkbox" id="editIsActive" {...register("isActive")} className="h-4 w-4 rounded border-gray-300" />
            <label htmlFor="editIsActive" className="text-sm font-medium text-gray-700">Active</label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loading size="sm" /> : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Customer">
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-900">{customer.name}</span>?
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loading size="sm" /> : "Delete"}
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
