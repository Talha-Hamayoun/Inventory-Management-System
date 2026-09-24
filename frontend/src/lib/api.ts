import { getDashboardStats } from "./api/dashboard/stats";
import { getSettings } from "./api/settings/get";
import { updateSettings } from "./api/settings/update";
import {
  listPosProducts,
  getWalkInCustomer,
  posCheckout,
  listHeldSales,
  createHeldSale,
  deleteHeldSale,
  type PosCheckoutRequest,
} from "./api/pos";
import type { CompanySettings } from "./api/settings/types";
import { listSalesOrders } from "./api/sales-orders/list";
import { getSalesOrder } from "./api/sales-orders/get";
import {
  createSalesOrder,
  type CreateSalesOrderRequest,
} from "./api/sales-orders/create";
import {
  updateSalesOrder,
  type UpdateSalesOrderRequest,
} from "./api/sales-orders/update";
import { updateSalesOrderStatus } from "./api/sales-orders/updateStatus";
import { deleteSalesOrder } from "./api/sales-orders/delete";
import {
  updatePayment,
  type UpdatePaymentRequest,
} from "./api/sales-orders/updatePayment";
import {
  addSalesOrderItems,
  type AddSalesOrderItemsRequest,
} from "./api/sales-orders/addItems";
import { createAlert, type CreateAlertRequest } from "./api/alerts/create";
import { deleteAlert } from "./api/alerts/delete";
import { getAlert } from "./api/alerts/get";
import { listAlerts } from "./api/alerts/list";
import { getTriggeredAlerts } from "./api/alerts/triggered";
import { updateAlert, type UpdateAlertRequest } from "./api/alerts/update";
import { listCustomers } from "./api/customers/list";
import { getCustomer } from "./api/customers/get";
import {
  createCustomer,
  type CreateCustomerRequest,
} from "./api/customers/create";
import {
  updateCustomer,
  type UpdateCustomerRequest,
} from "./api/customers/update";
import { deleteCustomer } from "./api/customers/delete";
import { getEntityHistory } from "./api/audit-logs/entity-history";
import { getAuditLog } from "./api/audit-logs/get";
import { listAuditLogs } from "./api/audit-logs/list";
import { getAuditStats } from "./api/audit-logs/stats";
import { login } from "./api/auth/login";
import { logout } from "./api/auth/logout";
import { me } from "./api/auth/me";
import { register } from "./api/auth/register";
import { verifyOtp } from "./api/auth/verify-otp";
import { resendOtp } from "./api/auth/resend-otp";
import {
  createCategory,
  type CreateCategoryRequest,
} from "./api/categories/create";
import { deleteCategory } from "./api/categories/delete";
import { bulkDeleteCategories } from "./api/categories/bulk-delete";
import { getCategory } from "./api/categories/get";
import { listCategories } from "./api/categories/list";
import { getCategoryTree } from "./api/categories/tree";
import {
  updateCategory,
  type UpdateCategoryRequest,
} from "./api/categories/update";
import {
  createInventoryItem,
  type CreateInventoryRequest,
} from "./api/inventory/create";
import {
  createMovement,
  type CreateMovementRequest,
} from "./api/inventory/create-movement";
import { deleteInventoryItem } from "./api/inventory/delete";
import { getInventoryItem } from "./api/inventory/get";
import { listInventory } from "./api/inventory/list";
import { listMovements } from "./api/inventory/list-movements";
import { getLowStockAlerts } from "./api/inventory/low-stock-alerts";
import {
  updateInventoryItem,
  type UpdateInventoryRequest,
} from "./api/inventory/update";
import {
  createProduct,
  type CreateProductRequest,
} from "./api/products/create";
import { deleteProduct } from "./api/products/delete";
import { bulkDeleteProducts } from "./api/products/bulk-delete";
import { getProduct } from "./api/products/get";
import { generateProductBarcode } from "./api/products/generate-barcode";
import { lookupProductByBarcode } from "./api/products/lookup-barcode";
import { listProducts } from "./api/products/list";
import {
  updateProduct,
  type UpdateProductRequest,
} from "./api/products/update";
import { cancelPurchaseOrder } from "./api/purchase-orders/cancel";
import {
  createPurchaseOrder,
  type CreatePurchaseOrderRequest,
} from "./api/purchase-orders/create";
import { getPurchaseOrder } from "./api/purchase-orders/get";
import { listPurchaseOrders } from "./api/purchase-orders/list";
import { receivePurchaseOrder } from "./api/purchase-orders/receive";
import {
  updatePurchaseOrder,
  type UpdatePurchaseOrderRequest,
} from "./api/purchase-orders/update";
import {
  createReservation,
  type CreateReservationRequest,
} from "./api/reservations/create";
import { getReservation } from "./api/reservations/get";
import { listReservations } from "./api/reservations/list";
import { releaseByOrder } from "./api/reservations/release-by-order";
import {
  updateReservation,
  type UpdateReservationRequest,
} from "./api/reservations/update";
import { createReturn, type CreateReturnRequest } from "./api/returns/create";
import { getReturn } from "./api/returns/get";
import { listReturns } from "./api/returns/list";
import { processReturn } from "./api/returns/process";
import { cancelReturn } from "./api/returns/cancel";
import { getReturnStats } from "./api/returns/stats";
import { createRole, type CreateRoleRequest } from "./api/roles/create";
import { deleteRole } from "./api/roles/delete";
import { getRole } from "./api/roles/get";
import { listRoles } from "./api/roles/list";
import { updateRole, type UpdateRoleRequest } from "./api/roles/update";
import {
  createSupplier,
  type CreateSupplierRequest,
} from "./api/suppliers/create";
import { deleteSupplier } from "./api/suppliers/delete";
import { getSupplier } from "./api/suppliers/get";
import { listSuppliers } from "./api/suppliers/list";
import { toggleSupplierStatus } from "./api/suppliers/toggle";
import {
  updateSupplier,
  type UpdateSupplierRequest,
} from "./api/suppliers/update";
import { deleteUser } from "./api/users/delete";
import { getUser } from "./api/users/get";
import { listUsers } from "./api/users/list";
import { updateUser, type UpdateUserRequest } from "./api/users/update";
import { approveUser } from "./api/users/approve";
import { rejectUser } from "./api/users/reject";
import {
  createWarehouse,
  type CreateWarehouseRequest,
} from "./api/warehouses/create";
import { deleteWarehouse } from "./api/warehouses/delete";
import { getWarehouse } from "./api/warehouses/get";
import { listWarehouses } from "./api/warehouses/list";
import { toggleWarehouseStatus } from "./api/warehouses/toggle";
import {
  updateWarehouse,
  type UpdateWarehouseRequest,
} from "./api/warehouses/update";

export type {
  CreateAlertRequest,
  CreateCategoryRequest,
  CreateInventoryRequest,
  CreateMovementRequest,
  CreateProductRequest,
  CreatePurchaseOrderRequest,
  CreateReservationRequest,
  CreateReturnRequest,
  CreateRoleRequest,
  CreateSupplierRequest,
  CreateWarehouseRequest,
  UpdateAlertRequest,
  UpdateCategoryRequest,
  UpdateInventoryRequest,
  UpdateProductRequest,
  UpdatePurchaseOrderRequest,
  UpdateReservationRequest,
  UpdateRoleRequest,
  UpdateSupplierRequest,
  UpdateUserRequest,
  UpdateWarehouseRequest,
  CreateSalesOrderRequest,
  UpdateSalesOrderRequest,
  CompanySettings,
  UpdatePaymentRequest,
};

// Dashboard API
export const dashboardApi = {
  stats: () => getDashboardStats(),
};

// Settings API
export const settingsApi = {
  get: () => getSettings(),
  update: (data: CompanySettings) => updateSettings(data),
};

// Auth API
export const authApi = {
  login: (data: { email: string; password: string }) => login(data),
  register: (data: { name: string; email: string; password: string }) =>
    register(data),
  verifyOtp: (data: { email: string; otp: string }) => verifyOtp(data),
  resendOtp: (data: { email: string }) => resendOtp(data),
  logout: () => logout(),
  me: () => me(),
};

// Products API
export const productsApi = {
  list: (params?: {
    page: number;
    limit: number;
    search?: string;
    categoryId?: string;
    status?: string;
  }) => listProducts(params),
  get: (id: string) => getProduct(id),
  lookupByBarcode: (barcode: string, warehouseId: string) =>
    lookupProductByBarcode(barcode, warehouseId),
  generateBarcode: (id: string, options?: { force?: boolean }) =>
    generateProductBarcode(id, options),
  create: (data: CreateProductRequest) => createProduct(data),
  update: (id: string, data: UpdateProductRequest) => updateProduct(id, data),
  delete: (id: string) => deleteProduct(id),
  bulkDelete: (ids: string[]) => bulkDeleteProducts(ids),
};

// Categories API
export const categoriesApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    listCategories(params),
  tree: () => getCategoryTree(),
  get: (id: string) => getCategory(id),
  create: (data: CreateCategoryRequest) => createCategory(data),
  update: (id: string, data: UpdateCategoryRequest) => updateCategory(id, data),
  delete: (id: string) => deleteCategory(id),
  bulkDelete: (ids: string[]) => bulkDeleteCategories(ids),
};

// Warehouses API
export const warehousesApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }) => listWarehouses(params),
  get: (id: string) => getWarehouse(id),
  create: (data: CreateWarehouseRequest) => createWarehouse(data),
  update: (id: string, data: UpdateWarehouseRequest) =>
    updateWarehouse(id, data),
  toggle: (id: string) => toggleWarehouseStatus(id),
  delete: (id: string) => deleteWarehouse(id),
};

// Inventory API
export const inventoryApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    warehouseId?: string;
    productId?: string;
    lowStock?: boolean;
  }) => listInventory(params),
  get: (id: string) => getInventoryItem(id),
  create: (data: CreateInventoryRequest) => createInventoryItem(data),
  update: (id: string, data: UpdateInventoryRequest) =>
    updateInventoryItem(id, data),
  listMovements: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    warehouseId?: string;
    productId?: string;
    type?: "IN" | "OUT" | "ADJUST" | "TRANSFER" | "RETURN";
    startDate?: string;
    endDate?: string;
  }) => listMovements(params),
  createMovement: (data: CreateMovementRequest) => createMovement(data),
  delete: (id: string) => deleteInventoryItem(id),
  lowStockAlerts: () => getLowStockAlerts(),
};

// Suppliers API
export const suppliersApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    listSuppliers(params),
  get: (id: string) => getSupplier(id),
  create: (data: CreateSupplierRequest) => createSupplier(data),
  update: (id: string, data: UpdateSupplierRequest) => updateSupplier(id, data),
  delete: (id: string) => deleteSupplier(id),
  toggle: (id: string) => toggleSupplierStatus(id),
};

// Purchase Orders API
export const purchaseOrdersApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    supplierId?: string;
    warehouseId?: string;
    status?:
      | "DRAFT"
      | "ORDERED"
      | "PARTIALLY_RECEIVED"
      | "COMPLETED"
      | "CANCELLED";
  }) => listPurchaseOrders(params),
  get: (id: string) => getPurchaseOrder(id),
  create: (data: CreatePurchaseOrderRequest) => createPurchaseOrder(data),
  update: (id: string, data: UpdatePurchaseOrderRequest) =>
    updatePurchaseOrder(id, data),
  receive: (
    id: string,
    items: { itemId: string; receivedQuantity: number }[],
  ) => receivePurchaseOrder(id, items),
  cancel: (id: string) => cancelPurchaseOrder(id),
};

// Reservations API
export const reservationsApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    orderId?: string;
    status?: "RESERVED" | "RELEASED" | "FULFILLED";
    warehouseId?: string;
  }) => listReservations(params),
  get: (id: string) => getReservation(id),
  create: (data: CreateReservationRequest) => createReservation(data),
  update: (id: string, data: UpdateReservationRequest) =>
    updateReservation(id, data),
  releaseByOrder: (orderId: string) => releaseByOrder(orderId),
};

// Returns API
export const returnsApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    returnType?: "SALES_RETURN" | "PURCHASE_RETURN";
    status?: "PENDING" | "PROCESSED" | "CANCELLED";
    search?: string;
    startDate?: string;
    endDate?: string;
  }) => listReturns(params),
  get: (id: string) => getReturn(id),
  create: (data: CreateReturnRequest) => createReturn(data),
  process: (id: string) => processReturn(id),
  cancel: (id: string) => cancelReturn(id),
  stats: () => getReturnStats(),
};

// Customers API
export const customersApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    listCustomers(params),
  get: (id: string) => getCustomer(id),
  create: (data: CreateCustomerRequest) => createCustomer(data),
  update: (id: string, data: UpdateCustomerRequest) => updateCustomer(id, data),
  delete: (id: string) => deleteCustomer(id),
};

// Sales Orders API
export const salesOrdersApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: "PENDING" | "CONFIRMED" | "FULFILLED" | "CANCELLED";
    customerId?: string;
  }) => listSalesOrders(params),
  get: (id: string) => getSalesOrder(id),
  create: (data: CreateSalesOrderRequest) => createSalesOrder(data),
  update: (id: string, data: UpdateSalesOrderRequest) =>
    updateSalesOrder(id, data),
  updateStatus: (id: string, status: "CONFIRMED" | "FULFILLED" | "CANCELLED") =>
    updateSalesOrderStatus(id, status),
  updatePayment: (id: string, data: UpdatePaymentRequest) =>
    updatePayment(id, data),
  addItems: (id: string, data: AddSalesOrderItemsRequest) =>
    addSalesOrderItems(id, data),
  delete: (id: string) => deleteSalesOrder(id),
};

export const posApi = {
  listProducts: (params: {
    warehouseId: string;
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
  }) => listPosProducts(params),
  getWalkInCustomer: () => getWalkInCustomer(),
  checkout: (data: PosCheckoutRequest) => posCheckout(data),
  listHeld: () => listHeldSales(),
  hold: (data: Parameters<typeof createHeldSale>[0]) => createHeldSale(data),
  deleteHeld: (id: string) => deleteHeldSale(id),
};

// Stock Alerts API
export const alertsApi = {
  list: (params?: { page?: number; limit?: number }) => listAlerts(params),
  triggered: () => getTriggeredAlerts(),
  get: (id: string) => getAlert(id),
  create: (data: CreateAlertRequest) => createAlert(data),
  update: (id: string, data: UpdateAlertRequest) => updateAlert(id, data),
  delete: (id: string) => deleteAlert(id),
};

// Roles API
export const rolesApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    listRoles(params),
  get: (id: string) => getRole(id),
  create: (data: CreateRoleRequest) => createRole(data),
  update: (id: string, data: UpdateRoleRequest) => updateRole(id, data),
  delete: (id: string) => deleteRole(id),
};

// Users API
export const usersApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    roleId?: string;
    accountStatus?:
      | "PENDING_EMAIL_VERIFICATION"
      | "PENDING_APPROVAL"
      | "APPROVED"
      | "REJECTED";
  }) => listUsers(params),
  get: (id: string) => getUser(id),
  update: (id: string, data: UpdateUserRequest) => updateUser(id, data),
  approve: (id: string) => approveUser(id),
  reject: (id: string, data?: { reason?: string }) => rejectUser(id, data),
  delete: (id: string) => deleteUser(id),
};

// Audit Logs API
export const auditLogsApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    entityType?: string;
    entityId?: string;
    userId?: string;
    action?: "CREATE" | "UPDATE" | "DELETE";
    startDate?: string;
    endDate?: string;
  }) => listAuditLogs(params),
  get: (id: string) => getAuditLog(id),
  entityHistory: (entityType: string, entityId: string) =>
    getEntityHistory(entityType, entityId),
  stats: () => getAuditStats(),
};
