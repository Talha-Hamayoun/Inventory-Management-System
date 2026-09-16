import { z } from "zod";

import { loginSchema, registerSchema } from "./auth.validator";
import { paginationSchema } from "./pagination.validator";
import { createRoleSchema, updateRoleSchema } from "./role.validator";
import { updateUserSchema } from "./user.validator";
import { createCategorySchema, updateCategorySchema } from "./category.validator";
import { createProductSchema, updateProductSchema, productQuerySchema, } from "./product.validator";
import { createWarehouseSchema, updateWarehouseSchema } from "./warehouse.validator";
import { createSupplierSchema, updateSupplierSchema } from "./supplier.validator";
import { createInventoryItemSchema, updateInventoryItemSchema, createInventoryMovementSchema, inventoryQuerySchema, movementQuerySchema, } from "./inventory.validator";
import { createPurchaseOrderSchema, updatePurchaseOrderSchema, receivePurchaseOrderItemSchema, poQuerySchema, } from "./purchase-order.validator";
import { createStockReservationSchema, updateStockReservationSchema, reservationQuerySchema, } from "./reservation.validator";
import { createReturnSchema, processReturnSchema, returnQuerySchema } from "./return.validator";
import { createStockAlertSchema, updateStockAlertSchema } from "./alert.validator";
import { createCustomerSchema, updateCustomerSchema, customerQuerySchema } from "./customer.validator";
import { createSalesOrderSchema, updateSalesOrderSchema, updateSalesOrderStatusSchema, salesOrderQuerySchema, updatePaymentSchema } from "./sales-order.validator";
import { auditQuerySchema } from "./audit-log.validator";

export const validator = {
  login: loginSchema,
  register: registerSchema,
  pagination: paginationSchema,
  createRole: createRoleSchema,
  updateRole: updateRoleSchema,
  updateUser: updateUserSchema,
  createCategory: createCategorySchema,
  updateCategory: updateCategorySchema,
  createProduct: createProductSchema,
  updateProduct: updateProductSchema,
  productQuery: productQuerySchema,
  createWarehouse: createWarehouseSchema,
  updateWarehouse: updateWarehouseSchema,
  createSupplier: createSupplierSchema,
  updateSupplier: updateSupplierSchema,
  createInventoryItem: createInventoryItemSchema,
  updateInventoryItem: updateInventoryItemSchema,
  createInventoryMovement: createInventoryMovementSchema,
  inventoryQuery: inventoryQuerySchema,
  movementQuery: movementQuerySchema,
  createPurchaseOrder: createPurchaseOrderSchema,
  updatePurchaseOrder: updatePurchaseOrderSchema,
  receivePurchaseOrderItem: receivePurchaseOrderItemSchema,
  receivePurchaseOrder: z.object({ items: z.array(receivePurchaseOrderItemSchema) }),
  poQuery: poQuerySchema,
  createStockReservation: createStockReservationSchema,
  updateStockReservation: updateStockReservationSchema,
  reservationQuery: reservationQuerySchema,
  createReturn: createReturnSchema,
  processReturn: processReturnSchema,
  returnQuery: returnQuerySchema,
  createCustomer: createCustomerSchema,
  updateCustomer: updateCustomerSchema,
  customerQuery: customerQuerySchema,
  createSalesOrder: createSalesOrderSchema,
  updateSalesOrder: updateSalesOrderSchema,
  updateSalesOrderStatus: updateSalesOrderStatusSchema,
  updatePayment: updatePaymentSchema,
  salesOrderQuery: salesOrderQuerySchema,
  createStockAlert: createStockAlertSchema,
  updateStockAlert: updateStockAlertSchema,
  auditQuery: auditQuerySchema,
} as const;

export type Validator = {
  Login: z.infer<typeof validator.login>;
  Register: z.infer<typeof validator.register>;
  Pagination: z.infer<typeof validator.pagination>;
  CreateRole: z.infer<typeof validator.createRole>;
  UpdateRole: z.infer<typeof validator.updateRole>;
  UpdateUser: z.infer<typeof validator.updateUser>;
  CreateCategory: z.infer<typeof validator.createCategory>;
  UpdateCategory: z.infer<typeof validator.updateCategory>;
  CreateProduct: z.infer<typeof validator.createProduct>;
  UpdateProduct: z.infer<typeof validator.updateProduct>;
  ProductQuery: z.infer<typeof validator.productQuery>;
  CreateWarehouse: z.infer<typeof validator.createWarehouse>;
  UpdateWarehouse: z.infer<typeof validator.updateWarehouse>;
  CreateSupplier: z.infer<typeof validator.createSupplier>;
  UpdateSupplier: z.infer<typeof validator.updateSupplier>;
  CreateInventoryItem: z.infer<typeof validator.createInventoryItem>;
  UpdateInventoryItem: z.infer<typeof validator.updateInventoryItem>;
  CreateInventoryMovement: z.infer<typeof validator.createInventoryMovement>;
  InventoryQuery: z.infer<typeof validator.inventoryQuery>;
  MovementQuery: z.infer<typeof validator.movementQuery>;
  CreatePurchaseOrder: z.infer<typeof validator.createPurchaseOrder>;
  UpdatePurchaseOrder: z.infer<typeof validator.updatePurchaseOrder>;
  ReceivePurchaseOrderItem: z.infer<typeof validator.receivePurchaseOrderItem>;
  ReceivePurchaseOrder: z.infer<typeof validator.receivePurchaseOrder>;
  PoQuery: z.infer<typeof validator.poQuery>;
  CreateStockReservation: z.infer<typeof validator.createStockReservation>;
  UpdateStockReservation: z.infer<typeof validator.updateStockReservation>;
  ReservationQuery: z.infer<typeof validator.reservationQuery>;
  CreateReturn: z.infer<typeof validator.createReturn>;
  ProcessReturn: z.infer<typeof validator.processReturn>;
  ReturnQuery: z.infer<typeof validator.returnQuery>;
  CreateCustomer: z.infer<typeof validator.createCustomer>;
  UpdateCustomer: z.infer<typeof validator.updateCustomer>;
  CustomerQuery: z.infer<typeof validator.customerQuery>;
  CreateSalesOrder: z.infer<typeof validator.createSalesOrder>;
  UpdateSalesOrder: z.infer<typeof validator.updateSalesOrder>;
  UpdateSalesOrderStatus: z.infer<typeof validator.updateSalesOrderStatus>;
  UpdatePayment: z.infer<typeof validator.updatePayment>;
  SalesOrderQuery: z.infer<typeof validator.salesOrderQuery>;
  CreateStockAlert: z.infer<typeof validator.createStockAlert>;
  UpdateStockAlert: z.infer<typeof validator.updateStockAlert>;
  AuditQuery: z.infer<typeof validator.auditQuery>;
};
