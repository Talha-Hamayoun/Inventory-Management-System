"use client";

import { DashboardLayout } from "@/src/components/dashboard-layout";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Loading } from "@/src/components/ui/loading";
import { Pagination } from "@/src/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import type { Reservation, ReservationStatus } from "@/src/lib/api/reservations/types";
import { reservationsApi } from "@/src/lib/api";
import { formatDateTime } from "@/src/lib/utils";
import { Eye, Plus, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const selectClass =
  "flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent";

const STATUS_VARIANTS: Record<ReservationStatus, "info" | "default" | "success"> = {
  RESERVED: "info",
  RELEASED: "default",
  FULFILLED: "success",
};

export default function ReservationsPage() {
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [status, setStatus] = useState<ReservationStatus | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReservations = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await reservationsApi.list({
        page,
        limit: 20,
        status: status || undefined,
      });
      if (response.data?.success) {
        setReservations(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Reservations</h1>
            <p className="text-gray-600">Manage stock reservations for orders</p>
          </div>
          <Link href="/reservations/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Reservation
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="pt-6">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value as ReservationStatus | ""); setPage(1); }}
              className={selectClass + " w-48"}
            >
              <option value="">All Statuses</option>
              <option value="RESERVED">Reserved</option>
              <option value="RELEASED">Released</option>
              <option value="FULFILLED">Fulfilled</option>
            </select>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loading size="lg" />
              </div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No reservations found</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reservation #</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell className="font-mono text-sm font-medium">
                          {reservation.reservationNumber}
                        </TableCell>
                        <TableCell className="text-gray-600 font-mono text-sm">
                          #{reservation.orderId}
                        </TableCell>
                        <TableCell className="font-medium">{reservation.product.name}</TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {reservation.product.sku ?? "—"}
                        </TableCell>
                        <TableCell className="text-gray-600">{reservation.warehouse.name}</TableCell>
                        <TableCell className="text-right font-semibold">{reservation.quantity}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANTS[reservation.status]}>
                            {reservation.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {formatDateTime(reservation.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/reservations/${reservation.id}`}>
                            <Button variant="outline" size="sm" className="gap-1">
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="mt-4">
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
