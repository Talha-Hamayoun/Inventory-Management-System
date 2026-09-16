import { Hono } from "hono";
import { apiValidator } from "../middlewares/apiValidator";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validator } from "../validators";
import { listAlertsController } from "../controllers/alerts/listAlerts";
import { getTriggeredAlertsController } from "../controllers/alerts/getTriggeredAlerts";
import { getAlertController } from "../controllers/alerts/getAlert";
import { createAlertController } from "../controllers/alerts/createAlert";
import { updateAlertController } from "../controllers/alerts/updateAlert";
import { deleteAlertController } from "../controllers/alerts/deleteAlert";

const alertsRoutes = new Hono();

alertsRoutes.use("*", authenticate);

alertsRoutes.get("/", apiValidator("query", validator.pagination), listAlertsController);
alertsRoutes.get("/triggered", getTriggeredAlertsController);
alertsRoutes.get("/:id", getAlertController);
alertsRoutes.post("/", authorize(["alerts:create"]), apiValidator("json", validator.createStockAlert), createAlertController);
alertsRoutes.put("/:id", authorize(["alerts:update"]), apiValidator("json", validator.updateStockAlert), updateAlertController);
alertsRoutes.delete("/:id", authorize(["alerts:delete"]), deleteAlertController);

export default alertsRoutes;
