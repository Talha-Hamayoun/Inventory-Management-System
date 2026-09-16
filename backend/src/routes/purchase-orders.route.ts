import { Hono } from "hono";
import { apiValidator } from "../middlewares/apiValidator";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validator } from "../validators";
import { listPurchaseOrdersController } from "../controllers/purchase-orders/listPurchaseOrders";
import { getPurchaseOrderController } from "../controllers/purchase-orders/getPurchaseOrder";
import { createPurchaseOrderController } from "../controllers/purchase-orders/createPurchaseOrder";
import { updatePurchaseOrderController } from "../controllers/purchase-orders/updatePurchaseOrder";
import { receivePurchaseOrderController } from "../controllers/purchase-orders/receivePurchaseOrder";
import { cancelPurchaseOrderController } from "../controllers/purchase-orders/cancelPurchaseOrder";

const purchaseOrdersRoutes = new Hono();

purchaseOrdersRoutes.use("*", authenticate);

purchaseOrdersRoutes.get("/", apiValidator("query", validator.poQuery), listPurchaseOrdersController);
purchaseOrdersRoutes.get("/:id", getPurchaseOrderController);
purchaseOrdersRoutes.post("/", authorize(["purchase-orders:create"]), apiValidator("json", validator.createPurchaseOrder), createPurchaseOrderController);
purchaseOrdersRoutes.put("/:id", authorize(["purchase-orders:update"]), apiValidator("json", validator.updatePurchaseOrder), updatePurchaseOrderController);
purchaseOrdersRoutes.post("/:id/receive", authorize(["purchase-orders:receive"]), apiValidator("json", validator.receivePurchaseOrder), receivePurchaseOrderController);
purchaseOrdersRoutes.post("/:id/cancel", authorize(["purchase-orders:cancel"]), cancelPurchaseOrderController);

export default purchaseOrdersRoutes;
