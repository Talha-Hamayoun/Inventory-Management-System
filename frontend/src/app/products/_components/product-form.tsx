"use client";

import { Button } from "@/src/components/ui/button";
import { Select } from "@/src/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Loading } from "@/src/components/ui/loading";
import { Modal } from "@/src/components/ui/modal";
import { categoriesApi, inventoryApi, productsApi, warehousesApi } from "@/src/lib/api";
import { useAuth } from "@/src/lib/auth-context";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Category, ProductDetail } from "@/src/lib/api/products/types";
import { buildEan13, isValidEan13 } from "@/src/lib/ean13";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
  categoryId: z.string().min(1, "Category is required"),
  unitOfMeasure: z.enum(["PCS", "KG", "LITERS", "METERS", "BOXES"]),
  barcode: z
    .string()
    .optional()
    .refine(
      (value) => !value || !value.trim() || isValidEan13(value.trim()),
      "Enter a valid 13-digit EAN-13 barcode (or leave blank)"
    ),
  costPrice: z
    .union([z.coerce.number().min(0, "Cost price must be non-negative"), z.literal("")])
    .optional(),
  sellingPrice: z
    .union([z.coerce.number().min(0, "Selling price must be non-negative"), z.literal("")])
    .optional(),
}).refine(
  (data) => {
    const cost =
      data.costPrice === "" || data.costPrice === undefined ? undefined : Number(data.costPrice);
    const sell =
      data.sellingPrice === "" || data.sellingPrice === undefined
        ? undefined
        : Number(data.sellingPrice);
    if (cost !== undefined && sell !== undefined) return sell >= cost;
    return true;
  },
  { message: "Selling price cannot be less than cost price", path: ["sellingPrice"] }
);

type ProductFormData = z.input<typeof productSchema>;

type WarehouseOption = { id: string; name: string };

interface ProductFormProps {
  productId?: string;
  categories: Category[];
  warehouses?: WarehouseOption[];
  initialData?: ProductDetail;
  backUrl?: string;
}

export function ProductForm({
  productId,
  categories: initialCategories,
  warehouses: warehousesProp,
  initialData,
  backUrl,
}: ProductFormProps) {
  const router = useRouter();
  const { hasPermission, hasAnyPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const isEditMode = !!productId && !!initialData;

  const canCreateCategory =
    hasPermission("categories:create") || hasPermission("*");
  const canCreateInventory =
    hasAnyPermission(["inventory:create", "*"]);

  const [categoryList, setCategoryList] = useState<Category[]>(initialCategories);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>(warehousesProp || []);

  const [addOpeningStock, setAddOpeningStock] = useState(false);
  const [warehouseId, setWarehouseId] = useState("");
  const [availableQuantity, setAvailableQuantity] = useState(0);
  const [minimumStockLevel, setMinimumStockLevel] = useState(0);
  const [maximumStockLevel, setMaximumStockLevel] = useState<string>("");
  const [reorderPoint, setReorderPoint] = useState<string>("");
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    setCategoryList(initialCategories);
  }, [initialCategories]);

  useEffect(() => {
    if (warehousesProp?.length) {
      setWarehouses(warehousesProp);
      return;
    }
    if (isEditMode || !canCreateInventory) return;
    (async () => {
      const res = await warehousesApi.list({ page: 1, limit: 100 });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setWarehouses(res.data.data.map((w: WarehouseOption) => ({ id: w.id, name: w.name })));
      }
    })();
  }, [warehousesProp, isEditMode, canCreateInventory]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: isEditMode
      ? {
          name: initialData.name,
          sku: initialData.sku,
          description: initialData.description || "",
          status: initialData.status,
          categoryId: initialData.categoryId || "",
          unitOfMeasure: (initialData.unitOfMeasure || "PCS") as
            | "PCS"
            | "KG"
            | "LITERS"
            | "METERS"
            | "BOXES",
          barcode: initialData.barcode || "",
          costPrice: initialData.costPrice ? Number(initialData.costPrice) : "",
          sellingPrice: initialData.sellingPrice ? Number(initialData.sellingPrice) : "",
        }
      : {
          status: "ACTIVE",
          unitOfMeasure: "PCS",
          barcode: "",
          costPrice: "",
          sellingPrice: "",
        },
  });

  const barcodeValue = watch("barcode") || "";

  const fillGeneratedBarcode = () => {
    const next = buildEan13("2");
    setValue("barcode", next, { shouldDirty: true, shouldValidate: true });
    toast.success(`EAN-13 generated: ${next}`);
  };

  const createCategoryQuick = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      toast.error("Category name is required");
      return;
    }
    setCreatingCategory(true);
    const res = await categoriesApi.create({
      name,
      description: newCategoryDescription.trim() || undefined,
      isActive: true,
    });
    setCreatingCategory(false);

    if (!res.data?.success || !res.data.data) {
      toast.error(
        (res.data && "message" in res.data && res.data.message) ||
          "Failed to create category"
      );
      return;
    }

    const created = res.data.data as Category;
    setCategoryList((prev) =>
      [...prev, { id: created.id, name: created.name }].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );
    setValue("categoryId", created.id, { shouldDirty: true, shouldValidate: true });
    setShowCategoryModal(false);
    setNewCategoryName("");
    setNewCategoryDescription("");
    toast.success(`Category "${created.name}" added`);
  };

  const onSubmit = async (data: ProductFormData): Promise<void> => {
    if (!isEditMode && addOpeningStock) {
      if (!warehouseId) {
        setInventoryError("Select a warehouse for opening stock");
        return;
      }
      if (availableQuantity < 0 || minimumStockLevel < 0) {
        setInventoryError("Stock quantities cannot be negative");
        return;
      }
      const max =
        maximumStockLevel.trim() === "" ? undefined : Number(maximumStockLevel);
      if (max !== undefined && (!Number.isFinite(max) || max < 0)) {
        setInventoryError("Maximum stock level is invalid");
        return;
      }
      if (max !== undefined && availableQuantity > max) {
        setInventoryError("Available quantity cannot exceed maximum stock level");
        return;
      }
      setInventoryError(null);
    }

    setLoading(true);
    try {
      const payload = {
        ...data,
        barcode: data.barcode?.trim() ? data.barcode.trim() : undefined,
        costPrice:
          data.costPrice === "" || data.costPrice === undefined
            ? undefined
            : Number(data.costPrice),
        sellingPrice:
          data.sellingPrice === "" || data.sellingPrice === undefined
            ? undefined
            : Number(data.sellingPrice),
      };
      const response = isEditMode
        ? await productsApi.update(productId, payload)
        : await productsApi.create(payload);

      if (!response.data || response.error) {
        toast.error(`Failed to ${isEditMode ? "update" : "create"} product`);
        return;
      }
      if (response.data.success === false) {
        toast.error(
          response.data.message ||
            `Failed to ${isEditMode ? "update" : "create"} product`
        );
        return;
      }

      if (!isEditMode && addOpeningStock && canCreateInventory) {
        const productIdCreated = (response.data.data as { id: string })?.id;
        if (productIdCreated) {
          const max =
            maximumStockLevel.trim() === ""
              ? undefined
              : Number(maximumStockLevel);
          const reorder =
            reorderPoint.trim() === "" ? undefined : Number(reorderPoint);

          const invRes = await inventoryApi.create({
            productId: productIdCreated,
            warehouseId,
            availableQuantity,
            minimumStockLevel,
            maximumStockLevel: max,
            reorderPoint: reorder,
          });

          if (!invRes.data?.success) {
            toast.warning(
              invRes.data?.message ||
                "Product created, but opening stock could not be added. Add it from Inventory."
            );
            router.push("/products");
            return;
          }
        }
      }

      toast.success(
        isEditMode
          ? "Product updated"
          : addOpeningStock
            ? "Product created with opening stock"
            : "Product created"
      );
      router.push(isEditMode ? backUrl || `/products/${productId}` : "/products");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={backUrl || "/products"} className="cursor-pointer">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? "Edit Product" : "New Product"}
          </h1>
          <p className="text-gray-600">
            {isEditMode
              ? "Update product information"
              : "Create a new product in your catalog"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Product Name *
                </label>
                <Input {...register("name")} placeholder="Enter product name" />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  SKU *
                </label>
                <Input {...register("sku")} placeholder="Enter SKU" />
                {errors.sku && (
                  <p className="mt-1 text-sm text-red-500">{errors.sku.message}</p>
                )}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                {...register("description")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter product description"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Status *
                </label>
                <Select {...register("status")} className="w-full">
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ARCHIVED">Archived</option>
                </Select>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  {canCreateCategory && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-2 p-2 text-xs text-blue-700"
                      onClick={() => setShowCategoryModal(true)}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      New Category
                    </Button>
                  )}
                </div>
                <Select {...register("categoryId")} className="w-full">
                  <option value="">Select a Category</option>
                  {categoryList.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
                {errors.categoryId && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.categoryId.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Unit of Measure *
                </label>
                <Select {...register("unitOfMeasure")} className="w-full">
                  <option value="PCS">Pieces</option>
                  <option value="KG">Kilogram</option>
                  <option value="LITERS">Liters</option>
                  <option value="METERS">Meters</option>
                  <option value="BOXES">Boxes</option>
                </Select>
              </div>
            </div>
            <div>
              <label
                className="mb-1 block text-sm font-medium text-gray-700"
                htmlFor="product-barcode"
              >
                Barcode
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  id="product-barcode"
                  {...register("barcode")}
                  placeholder="Enter EAN-13 or generate"
                  autoComplete="off"
                  inputMode="numeric"
                  disabled
                  className="bg-white text-gray-900 placeholder:text-gray-500 dark:bg-gray-100 dark:text-gray-900 dark:placeholder:text-gray-500"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  onClick={fillGeneratedBarcode}
                >
                  Generate EAN-13
                </Button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Optional. Use a valid EAN-13 for camera scanning, or leave blank and
                generate later from Inventory.
                {barcodeValue.trim() && !isValidEan13(barcodeValue.trim()) && (
                  <span className="ml-1 text-amber-600">
                    {" "}
                    Current value is not a valid EAN-13.
                  </span>
                )}
              </p>
              {errors.barcode && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.barcode.message as string}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Cost Price (Rs.)
                </label>
                <Input
                  {...register("costPrice")}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                />
                <p className="mt-1 text-xs text-gray-400">
                  What it costs you to acquire this product
                </p>
                {errors.costPrice && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.costPrice.message as string}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Selling Price (Rs.)
                </label>
                <Input
                  {...register("sellingPrice")}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Default price when creating sales orders
                </p>
                {errors.sellingPrice && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.sellingPrice.message as string}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {!isEditMode && canCreateInventory && (
          <Card>
            <CardHeader>
              <CardTitle>Initial Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={addOpeningStock}
                  onChange={(e) => {
                    setAddOpeningStock(e.target.checked);
                    setInventoryError(null);
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Add opening stock for this product
              </label>

              {addOpeningStock && (
                <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Warehouse *
                    </label>
                    <Select
                      value={warehouseId}
                      onChange={(e) => {
                        setWarehouseId(e.target.value);
                        setInventoryError(null);
                      }}
                      className="w-full bg-white"
                    >
                      <option value="">Select warehouse</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Available Quantity
                      </label>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={availableQuantity}
                        onChange={(e) =>
                          setAvailableQuantity(Number(e.target.value) || 0)
                        }
                        className="bg-white"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Minimum Stock Level
                      </label>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={minimumStockLevel}
                        onChange={(e) =>
                          setMinimumStockLevel(Number(e.target.value) || 0)
                        }
                        className="bg-white"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Maximum Stock Level
                      </label>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={maximumStockLevel}
                        onChange={(e) => setMaximumStockLevel(e.target.value)}
                        className="bg-white"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Reorder Point
                      </label>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={reorderPoint}
                        onChange={(e) => setReorderPoint(e.target.value)}
                        className="bg-white"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  {inventoryError && (
                    <p className="text-sm text-red-500">{inventoryError}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Link href={backUrl || "/products"} className="cursor-pointer">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <Loading size="sm" />
            ) : isEditMode ? (
              "Save Changes"
            ) : (
              "Create Product"
            )}
          </Button>
        </div>
      </form>

      <Modal
        isOpen={showCategoryModal}
        onClose={() => {
          if (!creatingCategory) setShowCategoryModal(false);
        }}
        title="Quick Add Category"
        size="sm"
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Name *
            </label>
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void createCategoryQuick();
                }
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <Input
              value={newCategoryDescription}
              onChange={(e) => setNewCategoryDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              disabled={creatingCategory}
              onClick={() => setShowCategoryModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={creatingCategory || !newCategoryName.trim()}
              onClick={() => void createCategoryQuick()}
            >
              {creatingCategory ? <Loading size="sm" /> : "Add Category"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
