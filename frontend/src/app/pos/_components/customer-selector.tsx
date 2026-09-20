"use client";

import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import { Modal } from "@/src/components/ui/modal";
import { customersApi } from "@/src/lib/api";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
  isWalkIn?: boolean;
}

interface CustomerSelectorProps {
  walkIn: CustomerOption | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  canCreate?: boolean;
}

export function CustomerSelector({
  walkIn,
  selectedId,
  onSelect,
  canCreate,
}: CustomerSelectorProps) {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await customersApi.list({
        page: 1,
        limit: 50,
        search: search.trim() || undefined,
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setCustomers(
          res.data.data.map((c: { id: string; name: string; phone: string }) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
          }))
        );
      }
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const options: CustomerOption[] = [];
  if (walkIn) options.push(walkIn);
  for (const c of customers) {
    if (walkIn && c.id === walkIn.id) continue;
    options.push(c);
  }

  const value = selectedId || walkIn?.id || "";

  const createCustomer = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    setCreating(true);
    const res = await customersApi.create({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
    });
    setCreating(false);
    if (res.data?.success && res.data.data) {
      const customer = res.data.data;
      setCustomers((prev) => [customer, ...prev.filter((c) => c.id !== customer.id)]);
      onSelect(customer.id);
      setShowCreate(false);
      setForm({ name: "", phone: "", email: "" });
      toast.success("Customer created");
    } else {
      toast.error(
        (res.data && "message" in res.data && res.data.message) || "Failed to create customer"
      );
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-end">
        {canCreate && (
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowCreate(true)}>
            <Plus className="mr-1 h-3 w-3" />
            New Customer
          </Button>
        )}
      </div>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search customers…"
        className="mb-2 h-9 bg-gray-50"
      />
      <Select
        value={value}
        onChange={(e) => onSelect(e.target.value || null)}
        className="bg-gray-50"
      >
        {options.map((c) => (
          <option key={c.id} value={c.id}>
            {c.isWalkIn || c.name === "Walk-in Customer"
              ? "Walk-in Customer"
              : `${c.name} — ${c.phone}`}
          </option>
        ))}
      </Select>
      {loading && <p className="mt-1 text-[10px] text-gray-400">Loading…</p>}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Quick Add Customer">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Customer name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Phone</label>
            <Input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="03XXXXXXXXX"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email (optional)</label>
            <Input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="email@example.com"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={createCustomer} disabled={creating}>
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create
          </Button>
        </div>
      </Modal>
    </div>
  );
}
