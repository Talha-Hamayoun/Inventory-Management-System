import { Hono } from "hono";
import { apiValidator } from "../middlewares/apiValidator";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validator } from "../validators";
import { listUsersController } from "../controllers/users/listUsers";
import { getUserController } from "../controllers/users/getUser";
import { updateUserController } from "../controllers/users/updateUser";
import { deleteUserController } from "../controllers/users/deleteUser";
import { approveUserController } from "../controllers/users/approveUser";
import { rejectUserController } from "../controllers/users/rejectUser";

const usersRoutes = new Hono();

usersRoutes.use("*", authenticate);

usersRoutes.get("/", authorize(["users:read"]), apiValidator("query", validator.userQuery), listUsersController);
usersRoutes.get("/:id", authorize(["users:read"]), getUserController);
usersRoutes.post("/:id/approve", authorize(["users:update"]), approveUserController);
usersRoutes.post("/:id/reject", authorize(["users:update"]), apiValidator("json", validator.rejectUser), rejectUserController);
usersRoutes.put("/:id", authorize(["users:update"]), apiValidator("json", validator.updateUser), updateUserController);
usersRoutes.delete("/:id", authorize(["users:delete"]), deleteUserController);

export default usersRoutes;
