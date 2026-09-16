import { Hono } from "hono";
import { apiValidator } from "../middlewares/apiValidator";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validator } from "../validators";
import { listReturnsController } from "../controllers/returns/listReturns";
import { getReturnController } from "../controllers/returns/getReturn";
import { createReturnController } from "../controllers/returns/createReturn";
import { processReturnController } from "../controllers/returns/processReturn";
import { cancelReturnController } from "../controllers/returns/cancelReturn";
import { getReturnStatsController } from "../controllers/returns/getReturnStats";

const returnsRoutes = new Hono();

returnsRoutes.use("*", authenticate);

returnsRoutes.get("/", apiValidator("query", validator.returnQuery), listReturnsController);
returnsRoutes.get("/stats/summary", authorize(["returns:read"]), getReturnStatsController);
returnsRoutes.get("/:id", getReturnController);
returnsRoutes.post("/", authorize(["returns:create"]), apiValidator("json", validator.createReturn), createReturnController);
returnsRoutes.post("/:id/process", authorize(["returns:update"]), processReturnController);
returnsRoutes.post("/:id/cancel", authorize(["returns:update"]), cancelReturnController);

export default returnsRoutes;
