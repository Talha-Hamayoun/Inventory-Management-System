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
import type { InventoryItem } from "@/src/lib/api/inventory/types";
import { inventoryApi, productsApi, warehousesApi } from "@/src/lib/api";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, ArrowUpDown, Barcode, Edit, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BarcodeModal } from "./_components/barcode-modal";

interface SimpleProduct {
  id: string;
  name: string;
  sku?: string;
}

interface SimpleWarehouse {
  id: string;
  name: string;
}

const stockLevelRefine = (data: {
  availableQuantity?: number;
  minimumStockLevel?: number;
  maximumStockLevel?: number;
  reorderPoint?: number;
}, ctx: z.RefinementCtx) => {
  const avail = data.availableQuantity ?? 0;
  const minLevel = data.minimumStockLevel ?? 0;
  const maxLevel = data.maximumStockLevel;
  const reorderPt = data.reorderPoint;

  if (maxLevel !== undefined) {
    if (maxLevel <= minLevel) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Maximum stock level must be greater than minimum stock level", path: ["maximumStockLevel"] });
    }
    if (avail > maxLevel) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Available quantity cannot exceed maximum stock level (${maxLevel})`, path: ["availableQuantity"] });
    }
  }
  if (reorderPt !== undefined) {
    if (reorderPt < minLevel) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Reorder point cannot be less than minimum stock level", path: ["reorderPoint"] });
    }
    if (maxLevel !== undefined && reorderPt > maxLevel) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Reorder point cannot exceed maximum stock level", path: ["reorderPoint"] });
    }
  }
};

const inventorySchema = z.object({
  productId: z.string().min(1, "Product is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  availableQuantity: z.number().int().min(0).optional(),
  minimumStockLevel: z.number().int().min(0).optional(),
  maximumStockLevel: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional(),
}).superRefine(stockLevelRefine);

const updateInventorySchema = z.object({
  availableQuantity: z.number().int().min(0).optional(),
  minimumStockLevel: z.number().int().min(0).optional(),
  maximumStockLevel: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional(),
}).superRefine(stockLevelRefine);

const movementSchema = z.object({
  type: z.enum(["IN", "OUT", "ADJUST", "TRANSFER", "RETURN"]),
  quantity: z.number().int().min(0, "Quantity must be 0 or greater"),
  referenceType: z.enum(["PO", "ORDER", "MANUAL", "TRANSFER", "RETURN"]),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => data.type === "ADJUST" || data.quantity > 0,
  { message: "Quantity must be greater than 0 for this movement type", path: ["quantity"] }
);

type InventoryFormData = z.infer<typeof inventorySchema>;
type UpdateInventoryFormData = z.infer<typeof updateInventorySchema>;
type MovementFormData = z.infer<typeof movementSchema>;

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [warehouses, setWarehouses] = useState<SimpleWarehouse[]>([]);
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [updating, setUpdating] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementItem, setMovementItem] = useState<InventoryItem | null>(null);
  const [movementLoading, setMovementLoading] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeItem, setBarcodeItem] = useState<InventoryItem | null>(null);

  const addForm = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: { availableQuantity: 0, minimumStockLevel: 0 },
  });

  const editForm = useForm<UpdateInventoryFormData>({
    resolver: zodResolver(updateInventorySchema),
  });

  const movementForm = useForm<MovementFormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: { type: "IN", quantity: 1, referenceType: "MANUAL" },
  });

  const fetchInventory = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await inventoryApi.list({
        page,
        limit: 10,
        search: search || undefined,
        warehouseId: warehouseFilter || undefined,
        lowStock: lowStock || undefined,
      });
      if (response.data?.success) {
        setItems(response.data.data);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        console.error("Failed to fetch inventory:", response);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, warehouseFilter, lowStock]);

  const fetchDropdowns = async (): Promise<void> => {
    const [prodRes, whRes] = await Promise.all([
      productsApi.list({ page: 1, limit: 100 }),
      warehousesApi.list({ page: 1, limit: 100 }),
    ]);
    if (prodRes.data && prodRes.data.success) setProducts(prodRes.data.data || []);
    if (whRes.data && whRes.data.success) setWarehouses(whRes.data.data || []);
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchInventory();
  };

  const handleOpenAdd = () => {
    addForm.reset({ availableQuantity: 0, minimumStockLevel: 0 });
    setShowAddModal(true);
  };

  const handleCloseAdd = () => {
    setShowAddModal(false);
    addForm.reset();
  };

  const onSubmitAdd = async (data: InventoryFormData): Promise<void> => {
    setSaving(true);
    try {
      const response = await inventoryApi.create(data);
      if (!response.data || response.error) {
        toast.error("Failed to create inventory item");
      } else if (response.data.success === false) {
        toast.error(response.data.message || "Failed to create inventory item");
      } else {
        toast.success("Inventory item created");
        handleCloseAdd();
        fetchInventory();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    editForm.reset({
      availableQuantity: item.availableQuantity,
      minimumStockLevel: item.minimumStockLevel,
      maximumStockLevel: item.maximumStockLevel ?? undefined,
      reorderPoint: item.reorderPoint ?? undefined,
    });
    setShowEditModal(true);
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setEditingItem(null);
    editForm.reset();
  };

  const onSubmitEdit = async (data: UpdateInventoryFormData): Promise<void> => {
    if (!editingItem) return;
    setUpdating(true);
    try {
      const response = await inventoryApi.update(editingItem.id, data);
      if (!response.data || response.error) {
        toast.error("Failed to update inventory item");
      } else if (response.data.success === false) {
        toast.error(response.data.message || "Failed to update inventory item");
      } else {
        toast.success("Inventory item updated");
        handleCloseEdit();
        fetchInventory();
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenMovement = (item: InventoryItem) => {
    setMovementItem(item);
    movementForm.reset({ type: "IN", quantity: 1, referenceType: "MANUAL" });
    setShowMovementModal(true);
  };

  const handleCloseMovement = () => {
    setShowMovementModal(false);
    setMovementItem(null);
    movementForm.reset();
  };

  const onSubmitMovement = async (data: MovementFormData): Promise<void> => {
    if (!movementItem) return;
    setMovementLoading(true);
    try {
      const response = await inventoryApi.createMovement({
        productId: movementItem.product.id,
        warehouseId: movementItem.warehouse.id,
        type: data.type,
        quantity: data.quantity,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        notes: data.notes,
      });
      if (!response.data || response.error) {
        toast.error("Failed to record movement");
      } else if (response.data.success === false) {
        toast.error(response.data.message || "Failed to record movement");
      } else {
        toast.success("Movement recorded");
        handleCloseMovement();
        fetchInventory();
      }
    } finally {
      setMovementLoading(false);
    }
  };

  const handleDeleteClick = (item: InventoryItem) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      const response = await inventoryApi.delete(itemToDelete.id);
      if (!response.data || response.error) {
        toast.error("Failed to delete inventory item");
      } else if (response.data.success === false) {
        toast.error(response.data.message || "Failed to delete inventory item");
      } else {
        toast.success("Inventory item deleted");
        setShowDeleteModal(false);
        setItemToDelete(null);
        fetchInventory();
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenBarcode = (item: InventoryItem) => {
    setBarcodeItem(item);
    setShowBarcodeModal(true);
  };

  const handleCloseBarcode = () => {
    setShowBarcodeModal(false);
    setBarcodeItem(null);
  };

  const handleBarcodeGenerated = (productId: string, barcode: string) => {
    setItems((current) =>
      current.map((row) =>
        row.product.id === productId
          ? { ...row, product: { ...row.product, barcode } }
          : row
      )
    );
    setBarcodeItem((current) =>
      current && current.product.id === productId
        ? { ...current, product: { ...current.product, barcode } }
        : current
    );
  };

  const isLowStock = (item: InventoryItem): boolean => {
    if (item.reorderPoint != null) return item.availableQuantity <= item.reorderPoint;
    if (item.minimumStockLevel > 0) return item.availableQuantity <= item.minimumStockLevel;
    return false;
  };


  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
            <p className="text-gray-600">Manage stock levels across warehouses</p>
          </div>
          <Button className="gap-2" onClick={handleOpenAdd}>
            <Plus className="h-4 w-4" />
            Add Inventory
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                <Input
                  placeholder="Search by product name, SKU, or barcode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" variant="outline" className="gap-2">
                  <Search className="h-4 w-4" />
                  Search
                </Button>
              </form>
              <Select
                value={warehouseFilter}
                onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1); }}
                className="w-48"
              >
                <option value="">All Warehouses</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>{wh.name}</option>
                ))}
              </Select>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={lowStock}
                  onChange={(e) => { setLowStock(e.target.checked); setPage(1); }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Low Stock Only</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loading size="lg" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No inventory items found.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item #</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Barcode</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead className="text-right">Available</TableHead>
                      <TableHead className="text-right">Reserved</TableHead>
                      <TableHead className="text-right">Damaged</TableHead>
                      <TableHead className="text-right">Min Level</TableHead>
                      <TableHead className="text-right">Reorder At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm text-gray-500">{item.itemNumber}</TableCell>
                        <TableCell className="font-medium">{item.product.name}</TableCell>
                        <TableCell className="text-gray-500">{item.product.sku || "-"}</TableCell>
                        <TableCell className="font-mono text-sm text-gray-600">
                          {item.product.barcode || "—"}
                        </TableCell>
                        <TableCell>{item.warehouse.name}</TableCell>
                        <TableCell className="text-right font-semibold">{item.availableQuantity}</TableCell>
                        <TableCell className="text-right text-gray-500">{item.reservedQuantity}</TableCell>
                        <TableCell className="text-right text-gray-500">{item.damagedQuantity}</TableCell>
                        <TableCell className="text-right text-gray-500">{item.minimumStockLevel}</TableCell>
                        <TableCell className="text-right text-gray-500">
                          {item.reorderPoint != null ? item.reorderPoint : "-"}
                        </TableCell>
                        <TableCell>
                          {isLowStock(item) ? (
                            <Badge variant="error" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Low Stock
                            </Badge>
                          ) : (
                            <Badge variant="success">In Stock</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenBarcode(item)}
                              title="View barcode"
                            >
                              <Barcode className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(item)}
                              title="Edit stock levels"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenMovement(item)}
                              className="gap-1"
                            >
                              <ArrowUpDown className="h-4 w-4" />
                              Movement
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(item)}
                              title="Delete inventory item"
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
                  <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <BarcodeModal
        item={barcodeItem}
        isOpen={showBarcodeModal}
        onClose={handleCloseBarcode}
        onGenerated={handleBarcodeGenerated}
      />

      {/* Add Inventory Modal */}
      <Modal isOpen={showAddModal} onClose={handleCloseAdd}>
        <ModalHeader>
          <ModalTitle>Add Inventory Item</ModalTitle>
        </ModalHeader>
        <form onSubmit={addForm.handleSubmit(onSubmitAdd)}>
          <ModalContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
              <Select {...addForm.register("productId")} className="w-full">
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </Select>
              {addForm.formState.errors.productId && (
                <p className="text-sm text-red-500 mt-1">{addForm.formState.errors.productId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse *</label>
              <Select {...addForm.register("warehouseId")} className="w-full">
                <option value="">Select warehouse</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>{wh.name}</option>
                ))}
              </Select>
              {addForm.formState.errors.warehouseId && (
                <p className="text-sm text-red-500 mt-1">{addForm.formState.errors.warehouseId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available Qty</label>
                <Input type="number" {...addForm.register("availableQuantity", { valueAsNumber: true })} placeholder="0" />
                {addForm.formState.errors.availableQuantity && (
                  <p className="text-sm text-red-500 mt-1">{addForm.formState.errors.availableQuantity.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Level</label>
                <Input type="number" {...addForm.register("minimumStockLevel", { valueAsNumber: true })} placeholder="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Stock Level</label>
                <Input type="number" {...addForm.register("maximumStockLevel", { setValueAs: (v) => v === "" ? undefined : parseInt(v, 10) })} placeholder="Optional" />
                {addForm.formState.errors.maximumStockLevel && (
                  <p className="text-sm text-red-500 mt-1">{addForm.formState.errors.maximumStockLevel.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Point</label>
                <Input type="number" {...addForm.register("reorderPoint", { setValueAs: (v) => v === "" ? undefined : parseInt(v, 10) })} placeholder="Optional" />
                {addForm.formState.errors.reorderPoint && (
                  <p className="text-sm text-red-500 mt-1">{addForm.formState.errors.reorderPoint.message}</p>
                )}
              </div>
            </div>
          </ModalContent>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={handleCloseAdd}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loading size="sm" /> : "Create"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Edit Stock Levels Modal */}
      <Modal isOpen={showEditModal} onClose={handleCloseEdit}>
        <ModalHeader>
          <ModalTitle>Edit Stock Levels</ModalTitle>
        </ModalHeader>
        <form onSubmit={editForm.handleSubmit(onSubmitEdit)}>
          <ModalContent className="space-y-4">
            {editingItem && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-medium">{editingItem.product.name}</p>
                <p className="text-gray-500">{editingItem.warehouse.name} · SKU: {editingItem.product.sku || "-"}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available Qty</label>
                <Input type="number" {...editForm.register("availableQuantity", { valueAsNumber: true })} />
                {editForm.formState.errors.availableQuantity && (
                  <p className="text-sm text-red-500 mt-1">{editForm.formState.errors.availableQuantity.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Level</label>
                <Input type="number" {...editForm.register("minimumStockLevel", { valueAsNumber: true })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Stock Level</label>
                <Input type="number" {...editForm.register("maximumStockLevel", { setValueAs: (v) => v === "" ? undefined : parseInt(v, 10) })} placeholder="Optional" />
                {editForm.formState.errors.maximumStockLevel && (
                  <p className="text-sm text-red-500 mt-1">{editForm.formState.errors.maximumStockLevel.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Point</label>
                <Input type="number" {...editForm.register("reorderPoint", { setValueAs: (v) => v === "" ? undefined : parseInt(v, 10) })} placeholder="Optional" />
                {editForm.formState.errors.reorderPoint && (
                  <p className="text-sm text-red-500 mt-1">{editForm.formState.errors.reorderPoint.message}</p>
                )}
              </div>
            </div>
          </ModalContent>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={handleCloseEdit}>Cancel</Button>
            <Button type="submit" disabled={updating}>
              {updating ? <Loading size="sm" /> : "Save Changes"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Movement Modal */}
      <Modal isOpen={showMovementModal} onClose={handleCloseMovement}>
        <ModalHeader>
          <ModalTitle>Record Stock Movement</ModalTitle>
        </ModalHeader>
        <form onSubmit={movementForm.handleSubmit(onSubmitMovement)}>
          <ModalContent className="space-y-4">
            {movementItem && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-medium">{movementItem.product.name}</p>
                <p className="text-gray-500">
                  {movementItem.warehouse.name} · Current Stock: {movementItem.availableQuantity}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Movement Type *</label>
              <Select {...movementForm.register("type")} className="w-full">
                <option value="IN">Stock In</option>
                <option value="OUT">Stock Out</option>
                <option value="ADJUST">Adjustment</option>
                <option value="TRANSFER">Transfer</option>
                <option value="RETURN">Return</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
              <Input
                type="number"
                {...movementForm.register("quantity", { valueAsNumber: true })}
                placeholder="Enter quantity"
              />
              {movementForm.formState.errors.quantity && (
                <p className="text-sm text-red-500 mt-1">{movementForm.formState.errors.quantity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference Type *</label>
              <Select {...movementForm.register("referenceType")} className="w-full">
                <option value="MANUAL">Manual</option>
                <option value="PO">Purchase Order</option>
                <option value="ORDER">Sales Order</option>
                <option value="TRANSFER">Transfer</option>
                <option value="RETURN">Return</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference ID</label>
              <Input {...movementForm.register("referenceId")} placeholder="Optional reference ID" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                {...movementForm.register("notes")}
                rows={3}
                placeholder="Optional notes..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
          </ModalContent>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={handleCloseMovement}>Cancel</Button>
            <Button type="submit" disabled={movementLoading}>
              {movementLoading ? <Loading size="sm" /> : "Record Movement"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={handleDeleteCancel}>
        <ModalHeader>
          <ModalTitle>Delete Inventory Item</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <p className="text-gray-600">
            Are you sure you want to delete the inventory record for{" "}
            <span className="font-semibold text-gray-900">{itemToDelete?.product?.name}</span>{" "}
            in <span className="font-semibold text-gray-900">{itemToDelete?.warehouse?.name}</span>?
          </p>
          <p className="text-sm text-gray-500 mt-2">
            This will remove the stock record entirely. Movement history will be preserved.
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
    </DashboardLayout>
  );
}
