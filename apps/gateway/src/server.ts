import { createMcpExpressApp } from "@modelcontextprotocol/express"
import { toNodeHandler } from "@modelcontextprotocol/node"
import { audit } from "@/audit/routes"
import { chatRoutes } from "@/chat/routes"
import { auth } from "@/auth/routes"
import { userOf, mcpUser } from "@/auth/identity"
import { adminOnly, keyAuth, sessionAuth } from "@/auth/middleware"
import { db, migrate } from "@/db/pool"
import { env } from "@/infra/env"
import { errorHandler } from "@/infra/http"
import { keys } from "@/keys/routes"
import { mcpHandler } from "@/mcp/handler"
import { servers } from "@/servers/routes"
import { seed } from "@/servers/seed"
import { users } from "@/users/routes"
import { seedAdmin } from "@/users/seed"
import { refreshStale, startHealthLoop } from "@/upstream/health"
await migrate()
await seedAdmin()
await seed()
await refreshStale(0)
const app = createMcpExpressApp({ host: "0.0.0.0", allowedHosts: env.ALLOWED_HOSTS.split(",") })
const node = toNodeHandler(mcpHandler)
app.get("/livez", (_req, res) => { res.json({ ok: true }) })
app.get("/healthz", async (_req, res) => {
  const alive = await db.query("SELECT 1").then(() => true, () => false)
  res.status(alive ? 200 : 503).json({ ok: alive })
})
app.use("/api/auth", auth)
app.use("/api/servers", sessionAuth, adminOnly, servers)
app.use("/api/users", sessionAuth, adminOnly, users)
app.use("/api/keys", sessionAuth, keys)
app.use("/api/audit", sessionAuth, adminOnly, audit)
app.use("/api/chat", sessionAuth, chatRoutes)
app.all("/mcp", keyAuth, (req, res) => { mcpUser.run(userOf(req), () => void node(req, res, req.body)) })
app.use(errorHandler)
const listener = app.listen(env.PORT, () => { console.log(`gateway listening on ${env.PORT}`) })
startHealthLoop()
const shutdown = async () => {
  await mcpHandler.close()
  listener.close(() => void db.end().then(() => process.exit(0)))
}
process.on("SIGTERM", () => void shutdown())
