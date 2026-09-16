import { Hono } from "hono";
import { apiValidator } from "../middlewares/apiValidator";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validator } from "../validators";
import { listSuppliersController } from "../controllers/suppliers/listSuppliers";
import { getSupplierController } from "../controllers/suppliers/getSupplier";
import { createSupplierController } from "../controllers/suppliers/createSupplier";
import { updateSupplierController } from "../controllers/suppliers/updateSupplier";
import { deleteSupplierController } from "../controllers/suppliers/deleteSupplier";
import { toggleSupplierStatusController } from "../controllers/suppliers/toggleSupplierStatus";

const suppliersRoutes = new Hono();

suppliersRoutes.use("*", authenticate);

suppliersRoutes.get("/", apiValidator("query", validator.pagination), listSuppliersController);
suppliersRoutes.get("/:id", getSupplierController);
suppliersRoutes.post("/", authorize(["suppliers:create"]), apiValidator("json", validator.createSupplier), createSupplierController);
suppliersRoutes.put("/:id", authorize(["suppliers:update"]), apiValidator("json", validator.updateSupplier), updateSupplierController);
suppliersRoutes.patch("/:id/toggle-status", authorize(["suppliers:update"]), toggleSupplierStatusController);
suppliersRoutes.delete("/:id", authorize(["suppliers:delete"]), deleteSupplierController);

export default suppliersRoutes;
