import { createMcpExpressApp } from "@modelcontextprotocol/express"
import { toNodeHandler } from "@modelcontextprotocol/node"
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server"
import { z } from "zod"
import { env } from "@/infra/env"
interface Note { id: number; text: string; created: string }
const notes: Note[] = []
let next = 1
const ok = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data) }] })
const handler = createMcpHandler(() => {
  const server = new McpServer({ name: "notes-mcp", version: "0.1.0" })
  server.registerTool("ping", { description: "Check that the notes server answers.", annotations: { readOnlyHint: true } }, () => ok("pong from notes"))
  server.registerTool("add_note", {
    description: "Save a short note. Notes live in memory and are lost on restart.",
    inputSchema: z.object({ text: z.string().min(1).max(500) }),
  }, ({ text }) => {
    const note = { id: next++, text, created: new Date().toISOString() }
    notes.push(note)
    return ok(note)
  })
  server.registerTool("list_notes", { description: "List all saved notes.", annotations: { readOnlyHint: true } }, () => ok(notes))
  server.registerTool("delete_note", {
    description: "Delete a note by its id.",
    inputSchema: z.object({ id: z.number().int().positive() }),
  }, ({ id }) => {
    const at = notes.findIndex((note) => note.id === id)
    if (at < 0) throw new Error(`no note with id ${id}`)
    notes.splice(at, 1)
    return ok({ deleted: id })
  })
  return server
})
const app = createMcpExpressApp({ host: "0.0.0.0", allowedHosts: env.ALLOWED_HOSTS.split(",") })
const node = toNodeHandler(handler)
app.get("/healthz", (_req, res) => { res.json({ ok: true }) })
app.all("/mcp", (req, res) => void node(req, res, req.body))
const listener = app.listen(env.PORT, () => { console.log(`notes-mcp listening on ${env.PORT}`) })
const shutdown = async () => {
  await handler.close()
  listener.close(() => process.exit(0))
}
process.on("SIGTERM", () => void shutdown())
