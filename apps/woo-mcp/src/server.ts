import { createMcpExpressApp } from "@modelcontextprotocol/express"
import { toNodeHandler } from "@modelcontextprotocol/node"
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server"
import { env } from "@/infra/env"
import { auth } from "@/infra/auth"
import { registerProducts } from "@/tools/products"
import { registerOrders } from "@/tools/orders"
const handler = createMcpHandler(() => {
  const server = new McpServer({ name: "woo-mcp", version: "0.1.0" })
  registerProducts(server)
  registerOrders(server)
  return server
})
const app = createMcpExpressApp({ host: "0.0.0.0", allowedHosts: env.ALLOWED_HOSTS.split(",") })
const node = toNodeHandler(handler)
app.get("/healthz", (_req, res) => { res.json({ ok: true }) })
app.all("/mcp", auth, (req, res) => void node(req, res, req.body))
const listener = app.listen(env.PORT, () => { console.log(`woo-mcp listening on ${env.PORT}`) })
const shutdown = async () => {
  await handler.close()
  listener.close(() => process.exit(0))
}
process.on("SIGTERM", () => void shutdown())
