"use client";

import { DashboardLayout } from "@/src/components/dashboard-layout";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Loading } from "@/src/components/ui/loading";
import { Modal } from "@/src/components/ui/modal";
import type { Reservation } from "@/src/lib/api/reservations/types";
import { reservationsApi } from "@/src/lib/api";
import { formatDateTime } from "@/src/lib/utils";
import { AlertTriangle, ArrowLeft, Box, Calendar, Hash, MapPin, Package, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const STATUS_VARIANTS: Record<string, "info" | "default" | "success"> = {
  RESERVED: "info",
  RELEASED: "default",
  FULFILLED: "success",
};

export default function ReservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);

  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const response = await reservationsApi.get(id);
        if (response.data?.success) {
          setReservation(response.data.data);
        } else {
          toast.error("Reservation not found");
          router.push("/reservations");
        }
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleRelease = async () => {
    if (!reservation) return;
    setReleasing(true);
    try {
      const response = await reservationsApi.update(reservation.id, { status: "RELEASED" });
      if (response.data?.success) {
        toast.success("Reservation released — stock returned to available inventory");
        setShowReleaseModal(false);
        setReservation(response.data.data);
      } else {
        toast.error(response.data?.message || "Failed to release reservation");
      }
    } finally {
      setReleasing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-16">
          <Loading size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!reservation) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/reservations">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 font-mono">
                  {reservation.reservationNumber}
                </h1>
                <Badge variant={STATUS_VARIANTS[reservation.status] ?? "default"}>
                  {reservation.status}
                </Badge>
              </div>
              <p className="text-gray-500 text-sm mt-0.5">Stock Reservation Details</p>
            </div>
          </div>

          {reservation.status === "RESERVED" && (
            <Button
              variant="outline"
              className="gap-2 text-red-600 border-red-200 hover:border-red-300 hover:text-red-700"
              onClick={() => setShowReleaseModal(true)}
            >
              <XCircle className="h-4 w-4" />
              Release
            </Button>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4 text-gray-500" />
                Product
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-400">Name</p>
                <p className="font-semibold text-gray-900">{reservation.product.name}</p>
              </div>
              {reservation.product.sku && (
                <div>
                  <p className="text-xs text-gray-400">SKU</p>
                  <p className="font-mono text-sm text-gray-700">{reservation.product.sku}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Warehouse */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-gray-500" />
                Warehouse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <p className="text-xs text-gray-400">Location</p>
                <p className="font-semibold text-gray-900">{reservation.warehouse.name}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reservation Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Box className="h-4 w-4 text-gray-500" />
              Reservation Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <dt className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                  <Hash className="h-3 w-3" /> Reservation #
                </dt>
                <dd className="font-mono font-semibold text-gray-900">{reservation.reservationNumber}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 mb-1">Order ID</dt>
                <dd className="font-mono font-semibold text-gray-900">#{reservation.orderId}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 mb-1">Reserved Quantity</dt>
                <dd className="text-2xl font-bold text-gray-900">{reservation.quantity}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 mb-1">Status</dt>
                <dd className="mt-1">
                  <Badge variant={STATUS_VARIANTS[reservation.status] ?? "default"}>
                    {reservation.status}
                  </Badge>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Timestamps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-gray-500" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-gray-400 mb-1">Created</dt>
                <dd className="text-sm text-gray-700">{formatDateTime(reservation.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 mb-1">Last Updated</dt>
                <dd className="text-sm text-gray-700">{formatDateTime(reservation.updatedAt)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Info banner for non-RESERVED statuses */}
        {reservation.status === "RELEASED" && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            This reservation has been <strong>released</strong>. The reserved stock has been returned to available inventory.
          </div>
        )}
        {reservation.status === "FULFILLED" && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            This reservation has been <strong>fulfilled</strong>. The reserved stock was used to complete the order.
          </div>
        )}
      </div>

      {/* Release Confirmation Modal */}
      <Modal isOpen={showReleaseModal} onClose={() => setShowReleaseModal(false)} size="sm">
        <div className="text-center space-y-4 p-2">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-red-600" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Release Reservation</h3>
            <p className="text-sm text-gray-500 mt-1">
              The reserved stock will be returned to available inventory. This cannot be undone.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-left space-y-1">
            <p><span className="text-gray-500">Reservation:</span> <span className="font-mono font-medium">{reservation.reservationNumber}</span></p>
            <p><span className="text-gray-500">Product:</span> <span className="font-medium">{reservation.product.name}</span></p>
            <p><span className="text-gray-500">Quantity:</span> <span className="font-medium">{reservation.quantity}</span></p>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => setShowReleaseModal(false)} disabled={releasing}>
              Keep
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleRelease} disabled={releasing}>
              {releasing ? <Loading size="sm" /> : "Release"}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
