import { Hono } from "hono";
import { apiValidator } from "../middlewares/apiValidator";
import { authenticate } from "../middlewares/authenticate";
import { validator } from "../validators";
import { registerController } from "../controllers/auth/register";
import { loginController } from "../controllers/auth/login";
import { logoutController } from "../controllers/auth/logout";
import { meController } from "../controllers/auth/me";

const authRoutes = new Hono();

authRoutes.post("/register", apiValidator("json", validator.register), registerController);
authRoutes.post("/login", apiValidator("json", validator.login), loginController);
authRoutes.post("/logout", logoutController);
authRoutes.get("/me", authenticate, meController);

export default authRoutes;
