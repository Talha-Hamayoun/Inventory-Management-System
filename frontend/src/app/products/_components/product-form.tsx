"use client";

import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Loading } from "@/src/components/ui/loading";
import { productsApi } from "@/src/lib/api";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Category, ProductDetail } from "@/src/lib/api/products/types";

const productSchema = z.object({
    name: z.string().min(1, "Name is required"),
    sku: z.string().min(1, "SKU is required"),
    description: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
    categoryId: z.string().min(1, "Category is required"),
    unitOfMeasure: z.enum(["PCS", "KG", "LITERS", "METERS", "BOXES"]),
    barcode: z.string().optional(),
    costPrice: z.union([z.coerce.number().min(0, "Cost price must be non-negative"), z.literal("")]).optional(),
    sellingPrice: z.union([z.coerce.number().min(0, "Selling price must be non-negative"), z.literal("")]).optional(),
}).refine(
    (data) => {
        const cost = data.costPrice === "" || data.costPrice === undefined ? undefined : Number(data.costPrice);
        const sell = data.sellingPrice === "" || data.sellingPrice === undefined ? undefined : Number(data.sellingPrice);
        if (cost !== undefined && sell !== undefined) return sell >= cost;
        return true;
    },
    { message: "Selling price cannot be less than cost price", path: ["sellingPrice"] }
);

type ProductFormData = z.input<typeof productSchema>;

interface ProductFormProps {
    productId?: string;
    categories: Category[];
    initialData?: ProductDetail;
    backUrl?: string;
}

export function ProductForm({ productId, categories, initialData, backUrl }: ProductFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const isEditMode = !!productId && !!initialData;

    const {
        register,
        handleSubmit,
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
                unitOfMeasure: (initialData.unitOfMeasure || "PCS") as "PCS" | "KG" | "LITERS" | "METERS" | "BOXES",
                barcode: initialData.barcode || "",
                costPrice: initialData.costPrice ? Number(initialData.costPrice) : "",
                sellingPrice: initialData.sellingPrice ? Number(initialData.sellingPrice) : "",
            }
            : {
                status: "ACTIVE",
                unitOfMeasure: "PCS",
                costPrice: "",
                sellingPrice: "",
            },
    });

    const onSubmit = async (data: ProductFormData): Promise<void> => {
        setLoading(true);
        try {
            const payload = {
                ...data,
                costPrice: data.costPrice === "" || data.costPrice === undefined ? undefined : Number(data.costPrice),
                sellingPrice: data.sellingPrice === "" || data.sellingPrice === undefined ? undefined : Number(data.sellingPrice),
            };
            const response = isEditMode
                ? await productsApi.update(productId, payload)
                : await productsApi.create(payload);
            if (!response.data || response.error) {
                toast.error(`Failed to ${isEditMode ? "update" : "create"} product`);
            } else if (response.data.success === false) {
                toast.error(response.data.message || `Failed to ${isEditMode ? "update" : "create"} product`);
            } else {
                toast.success(isEditMode ? "Product updated" : "Product created");
                router.push(isEditMode ? (backUrl || `/products/${productId}`) : "/products");
            }
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
                        {isEditMode ? "Update product information" : "Create a new product in your catalog"}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <Card>
                    <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                                <Input {...register("name")} placeholder="Enter product name" />
                                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                                <Input {...register("sku")} placeholder="Enter SKU" />
                                {errors.sku && <p className="text-sm text-red-500 mt-1">{errors.sku.message}</p>}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                {...register("description")}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                placeholder="Enter product description"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                                <select {...register("status")} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent">
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                    <option value="ARCHIVED">Archived</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                <select {...register("categoryId")} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent">
                                    <option value="">Select a Category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                {errors.categoryId && <p className="text-sm text-red-500 mt-1">{errors.categoryId.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure *</label>
                                <select {...register("unitOfMeasure")} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent">
                                    <option value="PCS">Pieces</option>
                                    <option value="KG">Kilogram</option>
                                    <option value="LITERS">Liters</option>
                                    <option value="METERS">Meters</option>
                                    <option value="BOXES">Boxes</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                            <Input {...register("barcode")} placeholder="Enter barcode" />
                        </div>
                    </CardContent>
                </Card>

                {/* Pricing */}
                <Card>
                    <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (Rs.)</label>
                                <Input {...register("costPrice")} type="number" min={0} step="0.01" placeholder="0.00" />
                                <p className="text-xs text-gray-400 mt-1">What it costs you to acquire this product</p>
                                {errors.costPrice && <p className="text-sm text-red-500 mt-1">{errors.costPrice.message as string}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (Rs.)</label>
                                <Input {...register("sellingPrice")} type="number" min={0} step="0.01" placeholder="0.00" />
                                <p className="text-xs text-gray-400 mt-1">Default price when creating sales orders</p>
                                {errors.sellingPrice && <p className="text-sm text-red-500 mt-1">{errors.sellingPrice.message as string}</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex justify-end gap-4">
                    <Link href={backUrl || "/products"} className="cursor-pointer">
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={loading}>
                        {loading ? <Loading size="sm" /> : isEditMode ? "Save Changes" : "Create Product"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
