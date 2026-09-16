import { Hono } from "hono";
import { authenticate } from "../middlewares/authenticate";
import { getDashboardStatsController } from "../controllers/dashboard/getDashboardStats";

const dashboardRoutes = new Hono();

dashboardRoutes.use("*", authenticate);

dashboardRoutes.get("/stats", getDashboardStatsController);

export default dashboardRoutes;
