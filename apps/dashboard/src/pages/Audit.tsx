import { useCallback, useEffect, useState } from "react"
import { api } from "@/api"
import { Button, Card, Empty, Loading, Notice, when } from "@/ui"
import type { AuditRow } from "@/types"
const page = 50
export default function Audit() {
  const [rows, setRows] = useState<AuditRow[]>([])
  const [more, setMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const load = useCallback(async (before?: string) => {
    setLoading(true)
    setError("")
    try {
      const got = await api<AuditRow[]>(`/api/audit?limit=${page}${before ? `&before=${before}` : ""}`)
      setRows((old) => (before ? [...old, ...got] : got))
      setMore(got.length === page)
    } catch (err) {
      setError(err instanceof Error ? err.message : "could not load the log")
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load])
  return (
    <Card title="Audit log of tool calls">
      <div className="mb-3"><Button onClick={() => void load()}>Refresh</Button></div>
      {error && <Notice kind="error">{error}</Notice>}
      {loading && rows.length === 0 && <Loading />}
      {!loading && rows.length === 0 && !error && <Empty>No tool calls yet.</Empty>}
      {rows.length > 0 && (
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-slate-200 text-slate-500"><th className="py-1">When</th><th>Who</th><th>Server</th><th>Tool</th><th>Via</th><th>Took</th><th>Result</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100">
                <td className="py-2">{when(row.started_at)}</td>
                <td>{row.user_email}</td>
                <td>{row.server ?? "-"}</td>
                <td className="font-mono text-xs">{row.tool}</td>
                <td>{row.source}</td>
                <td>{row.duration_ms} ms</td>
                <td className={row.ok ? "text-green-700" : "text-red-700"}>{row.ok ? "ok" : `failed: ${row.error ?? ""}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {more && <div className="mt-3"><Button onClick={() => void load(rows.at(-1)?.id)}>Load older</Button></div>}
    </Card>
  )
}
