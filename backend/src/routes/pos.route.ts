import { Hono } from "hono";
import { apiValidator } from "../middlewares/apiValidator";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validator } from "../validators";
import { posCheckoutController, getWalkInCustomerController } from "../controllers/pos/checkout";
import { listPosProductsController } from "../controllers/pos/listProducts";
import {
  listHeldSalesController,
  createHeldSaleController,
  deleteHeldSaleController,
} from "../controllers/pos/heldSales";

const posRoutes = new Hono();

posRoutes.use("*", authenticate);

posRoutes.get(
  "/products",
  authorize(["pos:view", "pos:create-sale", "sales-orders:create"]),
  apiValidator("query", validator.posProductQuery),
  listPosProductsController
);

posRoutes.get(
  "/walk-in-customer",
  authorize(["pos:view", "pos:create-sale", "sales-orders:create"]),
  getWalkInCustomerController
);

posRoutes.post(
  "/checkout",
  authorize(["pos:create-sale", "sales-orders:create"]),
  apiValidator("json", validator.posCheckout),
  posCheckoutController
);

posRoutes.get(
  "/held",
  authorize(["pos:hold-sale", "pos:create-sale", "sales-orders:create"]),
  listHeldSalesController
);

posRoutes.post(
  "/held",
  authorize(["pos:hold-sale", "pos:create-sale", "sales-orders:create"]),
  apiValidator("json", validator.posHold),
  createHeldSaleController
);

posRoutes.delete(
  "/held/:id",
  authorize(["pos:hold-sale", "pos:create-sale", "sales-orders:create"]),
  deleteHeldSaleController
);

export default posRoutes;
