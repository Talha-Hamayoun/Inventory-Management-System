import { Hono } from "hono";
import { apiValidator } from "../middlewares/apiValidator";
import { authenticate } from "../middlewares/authenticate";
import { validator } from "../validators";
import { registerController } from "../controllers/auth/register";
import { loginController } from "../controllers/auth/login";
import { logoutController } from "../controllers/auth/logout";
import { meController } from "../controllers/auth/me";
import { verifyOtpController } from "../controllers/auth/verifyOtp";
import { resendOtpController } from "../controllers/auth/resendOtp";

const authRoutes = new Hono();

authRoutes.post("/register", apiValidator("json", validator.register), registerController);
authRoutes.post("/login", apiValidator("json", validator.login), loginController);
authRoutes.post("/verify-otp", apiValidator("json", validator.verifyOtp), verifyOtpController);
authRoutes.post("/resend-otp", apiValidator("json", validator.resendOtp), resendOtpController);
authRoutes.post("/logout", logoutController);
authRoutes.get("/me", authenticate, meController);

export default authRoutes;
