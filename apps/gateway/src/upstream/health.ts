import { env } from "@/infra/env"
import { listEnabled, setStatus, type ServerRow } from "@/servers/repo"
import { describe, withClient } from "@/upstream/connect"
export async function refresh(row: ServerRow) {
  try {
    const { tools } = await withClient(row, env.LIST_TIMEOUT_MS, (client) => client.listTools())
    await setStatus(row.id, "connected", null, tools)
  } catch (err) {
    await setStatus(row.id, "unreachable", describe(err, env.LIST_TIMEOUT_MS))
  }
}
export async function refreshStale(maxAgeMs: number) {
  const rows = await listEnabled()
  const stale = rows.filter((row) => !row.checked_at || Date.now() - row.checked_at.getTime() > maxAgeMs)
  await Promise.allSettled(stale.map(refresh))
}
export function startHealthLoop() {
  setInterval(() => void refreshStale(0), env.HEALTH_INTERVAL_MS)
}
