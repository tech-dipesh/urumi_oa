import { createMcpHandler, Server } from "@modelcontextprotocol/server"
import { env } from "@/infra/env"
import { prefixed, split } from "@/mcp/names"
import { getByName, listEnabled, setStatus } from "@/servers/repo"
import { describe, withClient } from "@/upstream/connect"
import { refreshStale } from "@/upstream/health"
const fail = (text: string) => ({ content: [{ type: "text" as const, text }], isError: true })
function build() {
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- low level on purpose, we forward other servers tools untouched
  const server = new Server({ name: "urumi-gateway", version: "0.1.0" }, { capabilities: { tools: {} } })
  server.setRequestHandler("tools/list", async () => {
    await refreshStale(10000)
    const rows = await listEnabled()
    const live = rows.filter((row) => row.status === "connected")
    const tools = live.flatMap((row) => row.tools.map((tool) => ({ ...tool, name: prefixed(row.name, tool.name), description: `[${row.name}] ${tool.description ?? ""}`.trim() })))
    return { tools }
  })
  server.setRequestHandler("tools/call", async ({ params }) => {
    const started = Date.now()
    const target = split(params.name)
    const row = target ? await getByName(target.server) : undefined
    if (!target || !row?.enabled) return fail(`unknown tool ${params.name}`)
    try {
      const result = await withClient(row, env.CALL_TIMEOUT_MS, (client, signal) => client.callTool({ name: target.tool, arguments: params.arguments }, { signal }))
      if (row.status !== "connected") await setStatus(row.id, "connected", null)
      console.log(JSON.stringify({ tool: params.name, ms: Date.now() - started, ok: !result.isError }))
      return result
    } catch (err) {
      const reason = describe(err, env.CALL_TIMEOUT_MS)
      await setStatus(row.id, "unreachable", reason)
      console.log(JSON.stringify({ tool: params.name, ms: Date.now() - started, ok: false, reason }))
      return fail(`server ${row.name} failed: ${reason}`)
    }
  })
  return server
}
export const mcpHandler = createMcpHandler(build)
