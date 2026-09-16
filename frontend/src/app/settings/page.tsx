"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/src/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Loading } from "@/src/components/ui/loading";
import { settingsApi } from "@/src/lib/api";
import type { CompanySettings } from "@/src/lib/api/settings/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Building2, DollarSign, FileText, Globe, Mail, MapPin, Phone, Save } from "lucide-react";

const settingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyAddress: z.string().optional().or(z.literal("")),
  companyPhone: z.string().optional().or(z.literal("")),
  companyEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  companyWebsite: z.string().optional().or(z.literal("")),
  currencySymbol: z.string().min(1, "Currency symbol is required"),
  taxLabel: z.string().min(1, "Tax label is required"),
  taxRate: z.number().min(0).max(100),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    settingsApi.get().then((res) => {
      if (res.data?.success) {
        reset(res.data.data as SettingsFormData);
      }
      setLoading(false);
    });
  }, [reset]);

  const onSubmit = async (data: SettingsFormData) => {
    setSaving(true);
    try {
      const response = await settingsApi.update(data as CompanySettings);
      if (response.data?.success) {
        toast.success("Settings saved successfully");
        reset(data); // clear isDirty
      } else {
        toast.error(response.data?.message || "Failed to save settings");
      }
    } finally {
      setSaving(false);
    }
  };

  const currencySymbol = watch("currencySymbol");
  const taxRate = watch("taxRate");

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-16"><Loading size="lg" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                This information appears on invoices and printed documents.
              </p>
            </div>
            <Button type="submit" disabled={saving || !isDirty} className="gap-2">
              {saving ? <Loading size="sm" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-gray-500" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register("companyName")}
                  placeholder="Your Company Name"
                />
                {errors.companyName && (
                  <p className="text-sm text-red-500 mt-1">{errors.companyName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />Phone
                    </span>
                  </label>
                  <Input {...register("companyPhone")} placeholder="+92 300 1234567" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-gray-400" />Email
                    </span>
                  </label>
                  <Input {...register("companyEmail")} type="email" placeholder="info@company.com" />
                  {errors.companyEmail && (
                    <p className="text-sm text-red-500 mt-1">{errors.companyEmail.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-gray-400" />Website
                  </span>
                </label>
                <Input {...register("companyWebsite")} placeholder="https://yourcompany.com" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />Address
                  </span>
                </label>
                <textarea
                  {...register("companyAddress")}
                  rows={3}
                  placeholder="Street address, City, Country"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Invoice & Currency Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4 text-gray-500" />
                Invoice & Currency
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency Symbol <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register("currencySymbol")}
                    placeholder="Rs."
                    maxLength={5}
                  />
                  {errors.currencySymbol && (
                    <p className="text-sm text-red-500 mt-1">{errors.currencySymbol.message}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">e.g. Rs., $, €, £</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Label <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register("taxLabel")}
                    placeholder="Tax"
                    maxLength={20}
                  />
                  {errors.taxLabel && (
                    <p className="text-sm text-red-500 mt-1">{errors.taxLabel.message}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">e.g. Tax, GST, VAT</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Rate (%)
                  </label>
                  <Input
                    {...register("taxRate", { valueAsNumber: true })}
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    placeholder="0"
                  />
                  {errors.taxRate && (
                    <p className="text-sm text-red-500 mt-1">{errors.taxRate.message}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">0 to hide tax line on invoices</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Preview */}
          <Card className="border-dashed border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-gray-500">
                <FileText className="h-4 w-4" />
                Invoice Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-6 font-mono text-sm space-y-1 text-gray-600">
                <p className="text-base font-bold text-gray-900">{watch("companyName") || "Company Name"}</p>
                {watch("companyAddress") && <p className="text-xs text-gray-500">{watch("companyAddress")}</p>}
                {watch("companyPhone") && <p className="text-xs text-gray-500">📞 {watch("companyPhone")}</p>}
                {watch("companyEmail") && <p className="text-xs text-gray-500">✉ {watch("companyEmail")}</p>}
                <div className="border-t border-gray-200 pt-3 mt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Subtotal</span>
                    <span>{currencySymbol || "Rs."} 10,000.00</span>
                  </div>
                  {taxRate > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">{watch("taxLabel") || "Tax"} ({taxRate}%)</span>
                      <span>{currencySymbol || "Rs."} {(10000 * taxRate / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-bold text-gray-900 border-t border-gray-200 pt-1">
                    <span>Total</span>
                    <span>{currencySymbol || "Rs."} {taxRate > 0 ? (10000 + 10000 * taxRate / 100).toFixed(2) : "10,000.00"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save button (bottom) */}
          <div className="flex justify-end pb-4">
            <Button type="submit" disabled={saving || !isDirty} className="gap-2">
              {saving ? <Loading size="sm" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
