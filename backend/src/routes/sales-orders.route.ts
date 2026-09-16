import { Hono } from "hono";
import { apiValidator } from "../middlewares/apiValidator";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validator } from "../validators";
import { listSalesOrdersController } from "../controllers/sales-orders/listSalesOrders";
import { getSalesOrderController } from "../controllers/sales-orders/getSalesOrder";
import { createSalesOrderController } from "../controllers/sales-orders/createSalesOrder";
import { updateSalesOrderController } from "../controllers/sales-orders/updateSalesOrder";
import { updateSalesOrderStatusController } from "../controllers/sales-orders/updateSalesOrderStatus";
import { deleteSalesOrderController } from "../controllers/sales-orders/deleteSalesOrder";
import { updatePaymentController } from "../controllers/sales-orders/updatePayment";

const salesOrdersRoutes = new Hono();

salesOrdersRoutes.use("*", authenticate);

salesOrdersRoutes.get("/", apiValidator("query", validator.salesOrderQuery), listSalesOrdersController);
salesOrdersRoutes.get("/:id", getSalesOrderController);
salesOrdersRoutes.post("/", authorize(["sales-orders:create"]), apiValidator("json", validator.createSalesOrder), createSalesOrderController);
salesOrdersRoutes.put("/:id", authorize(["sales-orders:update"]), apiValidator("json", validator.updateSalesOrder), updateSalesOrderController);
salesOrdersRoutes.post("/:id/status", authorize(["sales-orders:update"]), apiValidator("json", validator.updateSalesOrderStatus), updateSalesOrderStatusController);
salesOrdersRoutes.patch("/:id/payment", authorize(["sales-orders:update"]), apiValidator("json", validator.updatePayment), updatePaymentController);
salesOrdersRoutes.delete("/:id", authorize(["sales-orders:delete"]), deleteSalesOrderController);

export default salesOrdersRoutes;
