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
import { rolesApi } from "@/src/lib/api";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Plus, Shield, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  _count?: { users: number };
}

const AVAILABLE_PERMISSIONS = [
  "products:read",
  "products:create",
  "products:update",
  "products:delete",
  "categories:read",
  "categories:create",
  "categories:update",
  "categories:delete",
  "inventory:read",
  "inventory:create",
  "inventory:update",
  "inventory:adjust",
  "warehouses:read",
  "warehouses:create",
  "warehouses:update",
  "warehouses:delete",
  "suppliers:read",
  "suppliers:create",
  "suppliers:update",
  "suppliers:delete",
  "purchase-orders:read",
  "purchase-orders:create",
  "purchase-orders:update",
  "purchase-orders:receive",
  "reservations:read",
  "reservations:create",
  "reservations:update",
  "returns:read",
  "returns:create",
  "alerts:read",
  "alerts:create",
  "alerts:update",
  "customers:read",
  "customers:create",
  "customers:update",
  "customers:delete",
  "sales-orders:read",
  "sales-orders:create",
  "sales-orders:update",
  "sales-orders:delete",
  "pos:view",
  "pos:create-sale",
  "pos:hold-sale",
  "pos:apply-discount",
  "users:read",
  "users:create",
  "users:update",
  "roles:read",
  "roles:create",
  "roles:update",
  "roles:delete",
  "audit:read",
];

const roleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, "At least one permission is required"),
});

type RoleFormData = z.infer<typeof roleSchema>;

export default function RolesPage() {
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      permissions: [],
    },
  });

  const selectedPermissions = watch("permissions");

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await rolesApi.list({ page, limit: 10 });
      if (!response.data || response.error) {
        console.error("Failed to fetch roles:", response.error);
      } else if (response.data.success === false) {
        console.error("Failed to fetch roles:", response.data);
      } else {
        setRoles(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleOpenModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      reset({
        name: role.name,
        description: role.description || "",
        permissions: role.permissions,
      });
    } else {
      setEditingRole(null);
      reset({
        name: "",
        description: "",
        permissions: [],
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRole(null);
    reset();
  };

  const togglePermission = (permission: string) => {
    const current = selectedPermissions || [];
    if (current.includes(permission)) {
      setValue(
        "permissions",
        current.filter((p) => p !== permission)
      );
    } else {
      setValue("permissions", [...current, permission]);
    }
  };

  const onSubmit = async (data: RoleFormData) => {
    setSaving(true);
    try {
      const response = editingRole
        ? await rolesApi.update(editingRole.id, data)
        : await rolesApi.create(data);
      if (!response.data || response.error) {
        console.error("Failed to save role:", response.error);
        toast.error("Failed to save role");
      } else if (response.data.success === false) {
        console.error("Failed to save role:", response.data);
        toast.error(response.data.message || "Failed to save role");
      } else {
        toast.success(editingRole ? "Role updated" : "Role created");
        handleCloseModal();
        fetchRoles();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm("Are you sure you want to delete this role?")) return;

    setDeleting(id);
    try {
      const response = await rolesApi.delete(id);
      if (!response.data || response.error) {
        console.error("Failed to delete role:", response.error);
        toast.error("Failed to delete role");
      } else if (response.data.success === false) {
        console.error("Failed to delete role:", response.data);
        toast.error(response.data.message || "Failed to delete role");
      } else {
        toast.success("Role deleted");
        fetchRoles();
      }
    } finally {
      setDeleting(null);
    }
  };

  const groupPermissionsByModule = () => {
    const groups: Record<string, string[]> = {};
    AVAILABLE_PERMISSIONS.forEach((p) => {
      const [module] = p.split(":");
      if (!groups[module]) groups[module] = [];
      groups[module].push(p);
    });
    return groups;
  };

  const permissionGroups = groupPermissionsByModule();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
            <p className="text-gray-600">Manage user roles and permissions</p>
          </div>
          <Button className="gap-2" onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4" />
            Add Role
          </Button>
        </div>

        {/* Roles Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loading size="lg" />
              </div>
            ) : roles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No roles found. Create your first role to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-500" />
                          {role.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 max-w-xs truncate">
                        {role.description || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {role.permissions.slice(0, 3).map((p) => (
                            <Badge key={p} variant="default" className="text-xs">
                              {p}
                            </Badge>
                          ))}
                          {role.permissions.length > 3 && (
                            <Badge variant="default" className="text-xs">
                              +{role.permissions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{role._count?.users || 0}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(role)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(role.id)}
                            disabled={deleting === role.id || (role._count?.users || 0) > 0}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Role Modal */}
      <Modal isOpen={showModal} onClose={handleCloseModal}>
        <ModalHeader>
          <ModalTitle>{editingRole ? "Edit Role" : "Add Role"}</ModalTitle>
        </ModalHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalContent className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <Input {...register("name")} placeholder="Role name" />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register("description")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Role description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions *
              </label>
              {errors.permissions && (
                <p className="text-sm text-red-500 mb-2">{errors.permissions.message}</p>
              )}
              <div className="space-y-4">
                {Object.entries(permissionGroups).map(([module, perms]) => (
                  <div key={module} className="border border-gray-200 rounded-lg p-3">
                    <p className="font-medium text-gray-700 capitalize mb-2">{module.replace("_", " ")}</p>
                    <div className="flex flex-wrap gap-2">
                      {perms.map((perm) => (
                        <label
                          key={perm}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer text-sm transition-colors ${
                            selectedPermissions?.includes(perm)
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions?.includes(perm) || false}
                            onChange={() => togglePermission(perm)}
                            className="sr-only"
                          />
                          {perm.split(":")[1]}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ModalContent>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loading size="sm" /> : editingRole ? "Save Changes" : "Create"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
