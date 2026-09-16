import { serve } from "bun";
import app from "./app";

const PORT = process.env.PORT || 3001;

console.log(`
🚀 Inventory Management System API
   Running on: http://localhost:${PORT}
   Health: http://localhost:${PORT}/health
   API Base: http://localhost:${PORT}/api
`);

serve({
  fetch: app.fetch,
  port: Number(PORT),
});