"use client";

import { DashboardLayout } from "@/src/components/dashboard-layout";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Select } from "@/src/components/ui/select";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Loading } from "@/src/components/ui/loading";
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "@/src/components/ui/modal";
import { Pagination } from "@/src/components/ui/pagination";
// ...existing code...
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { rolesApi, usersApi } from "@/src/lib/api";
import { toast } from "sonner";
import { formatDateTime } from "@/src/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Search, UserX, Users } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role: { id: string; name: string } | null;
  createdAt: string;
  lastLoginAt?: string;
}

interface Role {
  id: string;
  name: string;
}

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  roleId: z.string().min(1, "Role is required"),
  isActive: z.boolean(),
});

type UserFormData = z.infer<typeof userSchema>;

export default function UsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      isActive: true,
    },
  });

  const fetchUsers = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await usersApi.list({
        page,
        limit: 10,
        search: search || undefined,
        roleId: roleFilter || undefined,
      });
      if (!response.data || response.error) {
        console.error("Failed to fetch users:", response.error);
      } else if (response.data.success === false) {
        console.error("Failed to fetch users:", response.data);
      } else {
        setUsers(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, search]);

  const fetchRoles = async () => {
    try {
      const response = await rolesApi.list({ page: 1, limit: 100 });
      if (response.data?.success) setRoles(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleOpenModal = (user: User) => {
    setEditingUser(user);
    reset({
      name: user.name,
      email: user.email,
      roleId: user.role?.id ?? "",
      isActive: user.isActive,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    reset();
  };

  const onSubmit = async (data: UserFormData): Promise<void> => {
    if (!editingUser) return;

    setSaving(true);
    try {
      const response = await usersApi.update(editingUser.id, data);
      if (!response.data || response.error) {
        console.error("Failed to update user:", response.error);
        toast.error("Failed to update user");
      } else if (response.data.success === false) {
        console.error("Failed to update user:", response.data);
        toast.error(response.data.message || "Failed to update user");
      } else {
        toast.success("User updated");
        handleCloseModal();
        fetchUsers();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string): Promise<void> => {
    if (!confirm("Are you sure you want to deactivate this user?")) return;

    setDeactivating(id);
    try {
      const response = await usersApi.update(id, { isActive: false });
      if (!response.data || response.error) {
        console.error("Failed to deactivate user:", response.error);
        toast.error("Failed to deactivate user");
      } else if (response.data.success === false) {
        console.error("Failed to deactivate user:", response.data);
        toast.error(response.data.message || "Failed to deactivate user");
      } else {
        toast.success("User deactivated");
        fetchUsers();
      }
    } finally {
      setDeactivating(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <p className="text-gray-600">Manage system users</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-50">
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="w-48"
              >
                <option value="">All Roles</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </Select>
              <Button type="submit" variant="outline" className="gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loading size="lg" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No users found</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-gray-500">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="info">{user.role?.name ?? "—"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "success" : "error"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Never"}
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {formatDateTime(user.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenModal(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {user.isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeactivate(user.id)}
                                disabled={deactivating === user.id}
                              >
                                <UserX className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
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

      {/* Edit User Modal */}
      <Modal isOpen={showModal} onClose={handleCloseModal}>
        <ModalHeader>
          <ModalTitle>Edit User</ModalTitle>
        </ModalHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <Input {...register("name")} placeholder="User name" />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <Input {...register("email")} type="email" placeholder="Email" />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <Select {...register("roleId")} className="w-full">
                <option value="">Select role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </Select>
              {errors.roleId && (
                <p className="text-sm text-red-500 mt-1">{errors.roleId.message}</p>
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
              {saving ? <Loading size="sm" /> : "Save Changes"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
