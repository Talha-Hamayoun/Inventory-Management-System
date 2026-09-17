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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { rolesApi, usersApi } from "@/src/lib/api";
import type { AccountStatus, User } from "@/src/lib/api/users/list";
import { toast } from "sonner";
import { formatDateTime } from "@/src/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Edit, Search, UserX, Users, X } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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

const STATUS_LABELS: Record<AccountStatus, string> = {
  PENDING_EMAIL_VERIFICATION: "Pending Email",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

function statusBadgeVariant(status: AccountStatus, isActive: boolean): "success" | "warning" | "error" | "info" {
  if (status === "APPROVED") return isActive ? "success" : "error";
  if (status === "REJECTED") return "error";
  if (status === "PENDING_APPROVAL") return "warning";
  return "info";
}

export default function UsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingUser, setRejectingUser] = useState<User | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

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
        accountStatus: statusFilter || undefined,
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
  }, [page, roleFilter, search, statusFilter]);

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

  const handleApprove = async (user: User) => {
    setApprovingId(user.id);
    try {
      const response = await usersApi.approve(user.id);
      if (!response.data || response.error) {
        toast.error("Failed to approve user");
      } else if (response.data.success === false) {
        toast.error(response.data.message || "Failed to approve user");
      } else {
        toast.success("User approved. An email notification has been sent.");
        fetchUsers();
      }
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingUser) return;
    setRejecting(true);
    try {
      const response = await usersApi.reject(rejectingUser.id, {
        reason: rejectReason.trim() || undefined,
      });
      if (!response.data || response.error) {
        toast.error("Failed to reject user");
      } else if (response.data.success === false) {
        toast.error(response.data.message || "Failed to reject user");
      } else {
        toast.success("User rejected. An email notification has been sent.");
        setRejectingUser(null);
        setRejectReason("");
        fetchUsers();
      }
    } finally {
      setRejecting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <p className="text-gray-600">Manage system users and pending account requests</p>
          </div>
        </div>

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
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as AccountStatus | "");
                  setPage(1);
                }}
                className="w-52"
              >
                <option value="">All Statuses</option>
                <option value="PENDING_EMAIL_VERIFICATION">Pending Email</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </Select>
              <Button type="submit" variant="outline" className="gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

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
                      <TableHead>Email Verified</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Request Date</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-gray-500">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.emailVerified ? "success" : "warning"}>
                            {user.emailVerified ? "Verified" : "Unverified"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="info">{user.role?.name ?? "—"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(user.accountStatus, user.isActive)}>
                            {user.accountStatus === "APPROVED" && !user.isActive
                              ? "Inactive"
                              : STATUS_LABELS[user.accountStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {formatDateTime(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Never"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {user.accountStatus === "PENDING_APPROVAL" && user.emailVerified && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApprove(user)}
                                disabled={approvingId === user.id}
                                title="Approve"
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            {(user.accountStatus === "PENDING_APPROVAL" ||
                              user.accountStatus === "PENDING_EMAIL_VERIFICATION") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setRejectingUser(user);
                                  setRejectReason("");
                                }}
                                title="Reject"
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenModal(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {user.accountStatus === "APPROVED" && user.isActive && (
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

      <Modal
        isOpen={!!rejectingUser}
        onClose={() => {
          if (!rejecting) {
            setRejectingUser(null);
            setRejectReason("");
          }
        }}
      >
        <ModalHeader>
          <ModalTitle>Reject account request</ModalTitle>
        </ModalHeader>
        <ModalContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Reject <span className="font-medium text-gray-900">{rejectingUser?.name}</span>
            {rejectingUser?.email ? ` (${rejectingUser.email})` : ""}? They will be notified by email.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rejection reason (optional)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={500}
              rows={4}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Tell the user why their request was not approved"
            />
          </div>
        </ModalContent>
        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setRejectingUser(null);
              setRejectReason("");
            }}
            disabled={rejecting}
          >
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleReject} disabled={rejecting}>
            {rejecting ? <Loading size="sm" /> : "Reject"}
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
