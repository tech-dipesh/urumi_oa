import { createMcpExpressApp } from "@modelcontextprotocol/express"
import { toNodeHandler } from "@modelcontextprotocol/node"
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server"
import { z } from "zod"
import { env } from "@/infra/env"
const ok = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data) }] })
const local = (date: Date, timeZone: string) => new Intl.DateTimeFormat("en-GB", { timeZone, dateStyle: "full", timeStyle: "long" }).format(date)
const handler = createMcpHandler(() => {
  const server = new McpServer({ name: "time-mcp", version: "0.1.0" })
  server.registerTool("ping", { description: "Check that the time server answers.", annotations: { readOnlyHint: true } }, () => ok("pong from time"))
  server.registerTool("get_time", {
    description: "Get the current time in a timezone.",
    inputSchema: z.object({ timezone: z.string().default("UTC").describe("IANA name like Asia/Kolkata") }),
    annotations: { readOnlyHint: true },
  }, ({ timezone }) => ok({ timezone, iso: new Date().toISOString(), local: local(new Date(), timezone) }))
  server.registerTool("convert_time", {
    description: "Show a moment in another timezone.",
    inputSchema: z.object({ time: z.iso.datetime({ offset: true }).describe("ISO 8601 with offset or Z"), to_timezone: z.string().describe("IANA name like America/New_York") }),
    annotations: { readOnlyHint: true },
  }, ({ time, to_timezone }) => ok({ time, to_timezone, local: local(new Date(time), to_timezone) }))
  return server
})
const app = createMcpExpressApp({ host: "0.0.0.0", allowedHosts: env.ALLOWED_HOSTS.split(",") })
const node = toNodeHandler(handler)
app.get("/healthz", (_req, res) => { res.json({ ok: true }) })
app.all("/mcp", (req, res) => void node(req, res, req.body))
const listener = app.listen(env.PORT, () => { console.log(`time-mcp listening on ${env.PORT}`) })
const shutdown = async () => {
  await handler.close()
  listener.close(() => process.exit(0))
}
process.on("SIGTERM", () => void shutdown())
