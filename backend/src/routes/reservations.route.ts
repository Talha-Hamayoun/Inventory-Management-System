import { Hono } from "hono";
import { apiValidator } from "../middlewares/apiValidator";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validator } from "../validators";
import { listReservationsController } from "../controllers/reservations/listReservations";
import { getReservationController } from "../controllers/reservations/getReservation";
import { createReservationController } from "../controllers/reservations/createReservation";
import { updateReservationController } from "../controllers/reservations/updateReservation";
import { releaseByOrderController } from "../controllers/reservations/releaseByOrder";

const reservationsRoutes = new Hono();

reservationsRoutes.use("*", authenticate);

reservationsRoutes.get("/", apiValidator("query", validator.reservationQuery), listReservationsController);
reservationsRoutes.get("/:id", getReservationController);
reservationsRoutes.post("/", authorize(["reservations:create"]), apiValidator("json", validator.createStockReservation), createReservationController);
reservationsRoutes.put("/:id", authorize(["reservations:update"]), apiValidator("json", validator.updateStockReservation), updateReservationController);
reservationsRoutes.post("/release-by-order/:orderId", authorize(["reservations:update"]), releaseByOrderController);

export default reservationsRoutes;
