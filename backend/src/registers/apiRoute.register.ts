import { Hono } from "hono";

import authRoutes from "../routes/auth.route";
import rolesRoutes from "../routes/roles.route";
import usersRoutes from "../routes/users.route";
import categoriesRoutes from "../routes/categories.route";
import productsRoutes from "../routes/products.route";
import warehousesRoutes from "../routes/warehouses.route";
import suppliersRoutes from "../routes/suppliers.route";
import inventoryRoutes from "../routes/inventory.route";
import purchaseOrdersRoutes from "../routes/purchase-orders.route";
import reservationsRoutes from "../routes/reservations.route";
import returnsRoutes from "../routes/returns.route";
import alertsRoutes from "../routes/alerts.route";
import auditLogsRoutes from "../routes/audit-logs.route";
import customersRoutes from "../routes/customers.route";
import salesOrdersRoutes from "../routes/sales-orders.route";
import dashboardRoutes from "../routes/dashboard.route";
import settingsRoutes from "../routes/settings.route";

export function registerApiRoutes(app: Hono) {
  const api = new Hono();

  api.route("/auth", authRoutes);
  api.route("/roles", rolesRoutes);
  api.route("/users", usersRoutes);
  api.route("/categories", categoriesRoutes);
  api.route("/products", productsRoutes);
  api.route("/warehouses", warehousesRoutes);
  api.route("/suppliers", suppliersRoutes);
  api.route("/inventory", inventoryRoutes);
  api.route("/purchase-orders", purchaseOrdersRoutes);
  api.route("/reservations", reservationsRoutes);
  api.route("/returns", returnsRoutes);
  api.route("/alerts", alertsRoutes);
  api.route("/customers", customersRoutes);
  api.route("/sales-orders", salesOrdersRoutes);
  api.route("/audit-logs", auditLogsRoutes);
  api.route("/dashboard", dashboardRoutes);
  api.route("/settings", settingsRoutes);

  app.route("/api", api);
}
