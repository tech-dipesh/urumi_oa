import { useCallback, useEffect, useState } from "react"
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}
interface Init { method?: string; body?: unknown }
async function request(path: string, { method = "GET", body }: Init) {
  const res = await fetch(path, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined })
  if (res.ok) return res
  const data: { error?: unknown } | null = await res.json().catch(() => null)
  const message = typeof data?.error === "string" ? data.error : data?.error ? "please check the form and try again" : `request failed (${res.status})`
  throw new ApiError(res.status, message)
}
export async function api<T>(path: string, init: Init = {}): Promise<T> {
  const res = await request(path, init)
  return res.json() as Promise<T>
}
export async function send(path: string, init: Init = {}) {
  await request(path, init)
}
export function useLoad<T>(path: string) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState("")
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let alive = true
    api<T>(path).then((value) => { if (alive) { setData(value); setError("") } }, (err: Error) => { if (alive) setError(err.message) })
    return () => { alive = false }
  }, [path, tick])
  const reload = useCallback(() => setTick((n) => n + 1), [])
  return { data, error, reload, loading: data === null && error === "" }
}
