import { Hono } from "hono";
import { apiValidator } from "../middlewares/apiValidator";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validator } from "../validators";
import { listAuditLogsController } from "../controllers/audit-logs/listAuditLogs";
import { getAuditLogController } from "../controllers/audit-logs/getAuditLog";
import { getEntityHistoryController } from "../controllers/audit-logs/getEntityHistory";
import { getAuditStatsController } from "../controllers/audit-logs/getAuditStats";

const auditLogsRoutes = new Hono();

auditLogsRoutes.use("*", authenticate);

auditLogsRoutes.get("/", authorize(["audit:read"]), apiValidator("query", validator.auditQuery), listAuditLogsController);
auditLogsRoutes.get("/stats/summary", authorize(["audit:read"]), getAuditStatsController);
auditLogsRoutes.get("/entity/:entityType/:entityId", authorize(["audit:read"]), getEntityHistoryController);
auditLogsRoutes.get("/:id", authorize(["audit:read"]), getAuditLogController);

export default auditLogsRoutes;
