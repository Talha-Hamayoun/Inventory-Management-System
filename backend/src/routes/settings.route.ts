import { Hono } from "hono";
import { authenticate } from "../middlewares/authenticate";
import { getSettingsController } from "../controllers/settings/getSettings";
import { updateSettingsController } from "../controllers/settings/updateSettings";

const settingsRoutes = new Hono();

settingsRoutes.use("*", authenticate);

settingsRoutes.get("/", getSettingsController);
settingsRoutes.put("/", updateSettingsController);

export default settingsRoutes;
