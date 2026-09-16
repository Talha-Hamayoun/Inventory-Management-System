import { Hono } from "hono";
import { apiValidator } from "../middlewares/apiValidator";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validator } from "../validators";
import { listInventoryController } from "../controllers/inventory/listInventory";
import { getInventoryItemController } from "../controllers/inventory/getInventoryItem";
import { createInventoryItemController } from "../controllers/inventory/createInventoryItem";
import { updateInventoryItemController } from "../controllers/inventory/updateInventoryItem";
import { listMovementsController } from "../controllers/inventory/listMovements";
import { createMovementController } from "../controllers/inventory/createMovement";
import { deleteInventoryItemController } from "../controllers/inventory/deleteInventoryItem";
import { lowStockAlertsController } from "../controllers/inventory/lowStockAlerts";

const inventoryRoutes = new Hono();

inventoryRoutes.use("*", authenticate);

inventoryRoutes.get("/", apiValidator("query", validator.inventoryQuery), listInventoryController);
inventoryRoutes.get("/alerts/low-stock", lowStockAlertsController);
inventoryRoutes.get("/movements/list", apiValidator("query", validator.movementQuery), listMovementsController);
inventoryRoutes.get("/:id", getInventoryItemController);
inventoryRoutes.post("/", authorize(["inventory:create"]), apiValidator("json", validator.createInventoryItem), createInventoryItemController);
inventoryRoutes.put("/:id", authorize(["inventory:update"]), apiValidator("json", validator.updateInventoryItem), updateInventoryItemController);
inventoryRoutes.post("/movements", authorize(["inventory:adjust"]), apiValidator("json", validator.createInventoryMovement), createMovementController);
inventoryRoutes.delete("/:id", authorize(["inventory:delete"]), deleteInventoryItemController);

export default inventoryRoutes;
