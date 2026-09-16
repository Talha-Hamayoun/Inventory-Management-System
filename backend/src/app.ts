import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { errorHandler } from "./middlewares/error";
import { registerApiRoutes } from "./registers/apiRoute.register";

const app = new Hono();

// app.use("*", logger());
const FRONTEND_PRIVATE_URL = Bun.env.FRONTEND_PRIVATE_URL || "http://localhost:3000"

const FRONTEND_PUBLIC_URL = Bun.env.FRONTEND_PUBLIC_URL || "http://localhost:3000";

app.use(
  "*",
  cors({
    origin: [FRONTEND_PRIVATE_URL, FRONTEND_PUBLIC_URL, "http://localhost:3000", "http://localhost:5332", "http://localhost:5000"],
    credentials: true,
  })
);

// Global error handler (middleware)
app.use("*", errorHandler);

// Health check
app.get("/", (c) => {
  return c.json({
    message: "Inventory Management System API",
    version: "1.0.0",
    status: "healthy",
  });
});

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

registerApiRoutes(app);

export default app;