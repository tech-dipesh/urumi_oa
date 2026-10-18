import { createMcpExpressApp } from "@modelcontextprotocol/express"
import { toNodeHandler } from "@modelcontextprotocol/node"
import { db, migrate } from "@/db/pool"
import { auth } from "@/infra/auth"
import { env } from "@/infra/env"
import { errorHandler } from "@/infra/http"
import { mcpHandler } from "@/mcp/handler"
import { seed } from "@/servers/seed"
import { servers } from "@/servers/routes"
import { refreshStale, startHealthLoop } from "@/upstream/health"
await migrate()
await seed()
await refreshStale(0)
const app = createMcpExpressApp({ host: "0.0.0.0", allowedHosts: env.ALLOWED_HOSTS.split(",") })
const node = toNodeHandler(mcpHandler)
app.get("/livez", (_req, res) => { res.json({ ok: true }) })
app.get("/healthz", async (_req, res) => {
  const alive = await db.query("SELECT 1").then(() => true, () => false)
  res.status(alive ? 200 : 503).json({ ok: alive })
})
app.use("/api/servers", auth, servers)
app.all("/mcp", auth, (req, res) => void node(req, res, req.body))
app.use(errorHandler)
const listener = app.listen(env.PORT, () => { console.log(`gateway listening on ${env.PORT}`) })
startHealthLoop()
const shutdown = async () => {
  await mcpHandler.close()
  listener.close(() => void db.end().then(() => process.exit(0)))
}
process.on("SIGTERM", () => void shutdown())
