import { Hono } from "hono";
import { apiValidator } from "../middlewares/apiValidator";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validator } from "../validators";
import { listWarehousesController } from "../controllers/warehouses/listWarehouses";
import { getWarehouseController } from "../controllers/warehouses/getWarehouse";
import { createWarehouseController } from "../controllers/warehouses/createWarehouse";
import { updateWarehouseController } from "../controllers/warehouses/updateWarehouse";
import { deleteWarehouseController } from "../controllers/warehouses/deleteWarehouse";
import { toggleWarehouseStatusController } from "../controllers/warehouses/toggleWarehouseStatus";

const warehousesRoutes = new Hono();

warehousesRoutes.use("*", authenticate);

warehousesRoutes.get("/", apiValidator("query", validator.pagination), listWarehousesController);
warehousesRoutes.get("/:id", getWarehouseController);
warehousesRoutes.post("/", authorize(["warehouses:create"]), apiValidator("json", validator.createWarehouse), createWarehouseController);
warehousesRoutes.put("/:id", authorize(["warehouses:update"]), apiValidator("json", validator.updateWarehouse), updateWarehouseController);
warehousesRoutes.patch("/:id/toggle-status", authorize(["warehouses:update"]), toggleWarehouseStatusController);
warehousesRoutes.delete("/:id", authorize(["warehouses:delete"]), deleteWarehouseController);

export default warehousesRoutes;
