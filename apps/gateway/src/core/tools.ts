import { record } from "@/audit/repo"
import type { AuthUser } from "@/auth/identity"
import { env } from "@/infra/env"
import { prefixed, split } from "@/mcp/names"
import { getByName, listEnabled, setStatus } from "@/servers/repo"
import { describe, withClient } from "@/upstream/connect"
import { refreshStale } from "@/upstream/health"
export const fail = (text: string) => ({ content: [{ type: "text" as const, text }], isError: true })
export async function listTools() {
  await refreshStale(10000)
  const rows = await listEnabled()
  const live = rows.filter((row) => row.status === "connected")
  return live.flatMap((row) => row.tools.map((tool) => ({ ...tool, name: prefixed(row.name, tool.name), description: `[${row.name}] ${tool.description ?? ""}`.trim() })))
}
export async function runTool(user: AuthUser, source: "mcp" | "chat", name: string, args?: Record<string, unknown>) {
  const started = Date.now()
  const target = split(name)
  const row = target ? await getByName(target.server) : undefined
  const log = (ok: boolean, error: string | null) => record({ user, server: row?.name ?? null, tool: target?.tool ?? name, source, ms: Date.now() - started, ok, error })
  if (!target || !row?.enabled) {
    await log(false, "unknown tool")
    return fail(`unknown tool ${name}`)
  }
  try {
    const result = await withClient(row, env.CALL_TIMEOUT_MS, (client, signal) => client.callTool({ name: target.tool, arguments: args }, { signal }))
    if (row.status !== "connected") await setStatus(row.id, "connected", null)
    await log(!result.isError, result.isError ? "the tool returned an error" : null)
    return result
  } catch (err) {
    const reason = describe(err, env.CALL_TIMEOUT_MS)
    await setStatus(row.id, "unreachable", reason)
    await log(false, reason)
    return fail(`server ${row.name} failed: ${reason}`)
  }
}
