"use client";

import { DashboardLayout } from "@/src/components/dashboard-layout";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Loading } from "@/src/components/ui/loading";
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "@/src/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import type { SupplierDetail } from "@/src/lib/api/suppliers/types";
import { suppliersApi } from "@/src/lib/api";
import { formatDateTime } from "@/src/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  Edit,
  Mail,
  MapPin,
  Phone,
  ShoppingCart,
  ToggleLeft,
  ToggleRight,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const PO_STATUS_VARIANTS: Record<string, "default" | "info" | "warning" | "success" | "error"> = {
  DRAFT: "default",
  ORDERED: "info",
  PARTIALLY_RECEIVED: "warning",
  COMPLETED: "success",
  CANCELLED: "error",
};

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

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [toggling, setToggling] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
  });

  const fetchSupplier = async () => {
    setLoading(true);
    try {
      const response = await suppliersApi.get(id);
      if (response.data?.success) {
        setSupplier(response.data.data as SupplierDetail);
      } else {
        toast.error("Supplier not found");
        router.push("/suppliers");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSupplier(); }, [id]);

  const openEdit = () => {
    if (!supplier) return;
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
    setShowEditModal(true);
  };

  const onSubmit = async (data: SupplierFormData) => {
    if (!supplier) return;
    setSaving(true);
    try {
      const response = await suppliersApi.update(supplier.id, data);
      if (!response.data?.success) {
        toast.error(response.data?.message || "Failed to update supplier");
      } else {
        toast.success("Supplier updated");
        setShowEditModal(false);
        setSupplier({ ...supplier, ...(response.data.data as SupplierDetail) });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!supplier) return;
    setDeleting(true);
    try {
      const response = await suppliersApi.delete(supplier.id);
      if (!response.data?.success) {
        toast.error(response.data?.message || "Failed to delete supplier");
      } else {
        toast.success("Supplier deleted");
        router.push("/suppliers");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async () => {
    if (!supplier) return;
    setToggling(true);
    try {
      const response = await suppliersApi.toggle(supplier.id);
      if (!response.data?.success) {
        toast.error(response.data?.message || "Failed to update status");
      } else {
        toast.success(supplier.isActive ? `${supplier.name} deactivated` : `${supplier.name} activated`);
        setShowToggleModal(false);
        // Preserve purchaseOrders — toggle only changes isActive
        setSupplier({ ...supplier, isActive: !supplier.isActive });
      }
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-16"><Loading size="lg" /></div>
      </DashboardLayout>
    );
  }

  if (!supplier) return null;

  const location = [supplier.city, supplier.country].filter(Boolean).join(", ");

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/suppliers">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />Back
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-gray-400" />
                <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
                <Badge variant={supplier.isActive ? "success" : "error"}>
                  {supplier.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">Code: <span className="font-mono">{supplier.code}</span></p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowToggleModal(true)}
              title={supplier.isActive ? "Deactivate supplier" : "Activate supplier"}
            >
              {supplier.isActive
                ? <><ToggleRight className="h-4 w-4 text-green-500" />Deactivate</>
                : <><ToggleLeft className="h-4 w-4 text-gray-400" />Activate</>}
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={openEdit}>
              <Edit className="h-4 w-4" />Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-red-600 border-red-200 hover:border-red-300 hover:text-red-700"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="h-4 w-4" />Delete
            </Button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-gray-500" />Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Contact Person</p>
                  <p className={supplier.contactName ? "font-medium text-gray-900" : "text-gray-400"}>
                    {supplier.contactName || "Not provided"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  {supplier.email ? (
                    <a href={`mailto:${supplier.email}`} className="text-blue-600 hover:underline text-sm">
                      {supplier.email}
                    </a>
                  ) : (
                    <p className="text-gray-400">Not provided</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className={supplier.phone ? "font-mono font-medium text-gray-900" : "text-gray-400"}>
                    {supplier.phone || "Not provided"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Location</p>
                  <p className={location || supplier.address ? "text-gray-900" : "text-gray-400"}>
                    {supplier.address
                      ? location ? `${supplier.address}, ${location}` : supplier.address
                      : location || "Not provided"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-gray-500" />Business Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Payment Terms</p>
                  <p className={supplier.paymentTerms ? "font-medium text-gray-900" : "text-gray-400"}>
                    {supplier.paymentTerms || "Not specified"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Lead Time</p>
                  <p className={supplier.leadTimeDays ? "font-medium text-gray-900" : "text-gray-400"}>
                    {supplier.leadTimeDays ? `${supplier.leadTimeDays} days` : "Not specified"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Total Purchase Orders</p>
                <p className="text-2xl font-bold text-gray-900">{supplier._count?.purchaseOrders ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Supplier Since</p>
                <p className="text-sm text-gray-700">{formatDateTime(supplier.createdAt)}</p>
              </div>
              {supplier.notes && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Notes</p>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded p-2">{supplier.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Purchase Order History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="h-4 w-4 text-gray-500" />
                Purchase Order History
                <span className="text-sm font-normal text-gray-400">(last 10)</span>
              </CardTitle>
              <Link href={`/purchase-orders?supplierId=${supplier.id}`}>
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!supplier.purchaseOrders || supplier.purchaseOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <ShoppingCart className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                No purchase orders yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplier.purchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-mono text-sm font-semibold">{po.poNumber}</TableCell>
                      <TableCell>
                        <Badge variant={PO_STATUS_VARIANTS[po.status] ?? "default"}>
                          {po.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${Number(po.totalCost).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">{formatDateTime(po.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/purchase-orders/${po.id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        <ModalHeader><ModalTitle>Edit Supplier</ModalTitle></ModalHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <Input {...register("name")} placeholder="Supplier name" />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <Input {...register("code")} placeholder="SUP-001" />
                {errors.code && <p className="text-sm text-red-500 mt-1">{errors.code.message}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
              <Input {...register("contactName")} placeholder="Contact person" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input {...register("email")} type="email" placeholder="Email" />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <Input {...register("phone")} placeholder="Phone number" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <Input {...register("address")} placeholder="Street address" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <Input {...register("city")} placeholder="City" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <Input {...register("country")} placeholder="Country" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                <Input {...register("paymentTerms")} placeholder="e.g., Net 30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lead Time (days)</label>
                <Input {...register("leadTimeDays", { valueAsNumber: true })} type="number" placeholder="0" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                {...register("notes")}
                rows={3}
                placeholder="Additional notes..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" {...register("isActive")} className="rounded border-gray-300" />
              <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
            </div>
          </ModalContent>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loading size="sm" /> : "Save Changes"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <ModalHeader><ModalTitle>Delete Supplier</ModalTitle></ModalHeader>
        <ModalContent>
          <p className="text-gray-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-900">{supplier.name}</span>?
          </p>
          <p className="text-sm text-gray-500 mt-2">
            This action cannot be undone. Existing purchase orders will remain in the system.
          </p>
        </ModalContent>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={deleting}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loading size="sm" /> : "Delete"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Toggle Status Modal */}
      <Modal isOpen={showToggleModal} onClose={() => setShowToggleModal(false)}>
        <ModalHeader>
          <ModalTitle>{supplier.isActive ? "Deactivate Supplier" : "Activate Supplier"}</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <p className="text-gray-600">
            Are you sure you want to {supplier.isActive ? "deactivate" : "activate"}{" "}
            <span className="font-semibold text-gray-900">{supplier.name}</span>?
          </p>
          {supplier.isActive && (
            <p className="text-sm text-gray-500 mt-2">
              Deactivating will prevent new purchase orders from being created for this supplier.
            </p>
          )}
        </ModalContent>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowToggleModal(false)} disabled={toggling}>Cancel</Button>
          <Button
            variant={supplier.isActive ? "destructive" : "default"}
            onClick={handleToggle}
            disabled={toggling}
          >
            {toggling ? <Loading size="sm" /> : supplier.isActive ? "Deactivate" : "Activate"}
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
