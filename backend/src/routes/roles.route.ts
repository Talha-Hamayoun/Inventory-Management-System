import { Hono } from "hono";
import { apiValidator } from "../middlewares/apiValidator";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validator } from "../validators";
import { listRolesController } from "../controllers/roles/listRoles";
import { getRoleController } from "../controllers/roles/getRole";
import { createRoleController } from "../controllers/roles/createRole";
import { updateRoleController } from "../controllers/roles/updateRole";
import { deleteRoleController } from "../controllers/roles/deleteRole";

const rolesRoutes = new Hono();

rolesRoutes.use("*", authenticate);

rolesRoutes.get("/", apiValidator("query", validator.pagination), listRolesController);
rolesRoutes.get("/:id", getRoleController);
rolesRoutes.post("/", authorize(["roles:create"]), apiValidator("json", validator.createRole), createRoleController);
rolesRoutes.put("/:id", authorize(["roles:update"]), apiValidator("json", validator.updateRole), updateRoleController);
rolesRoutes.delete("/:id", authorize(["roles:delete"]), deleteRoleController);

export default rolesRoutes;
