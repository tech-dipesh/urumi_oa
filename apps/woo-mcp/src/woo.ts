import type { z } from "zod"
import { env } from "@/infra/env"
const base = `${env.WOO_URL.replace(/\/$/, "")}/wp-json/wc/v3`
const authorization = `Basic ${Buffer.from(`${env.WOO_CONSUMER_KEY}:${env.WOO_CONSUMER_SECRET}`).toString("base64")}`
interface Options { method?: string; body?: object; query?: Record<string, string | number | undefined> }
export async function woo<T extends z.ZodType>(path: string, { method = "GET", body, query = {} }: Options, schema: T): Promise<z.output<T>> {
  const entries = Object.entries(query).filter(([, value]) => value !== undefined)
  const params = new URLSearchParams(entries.map(([key, value]) => [key, String(value)]))
  let res: Response
  try {
    res = await fetch(`${base}${path}?${params}`, { method, headers: { Authorization: authorization, "Content-Type": "application/json", "X-Forwarded-Proto": "https" }, body: body && JSON.stringify(body), signal: AbortSignal.timeout(8000) })
  } catch {
    throw new Error("woocommerce did not answer in 8s or could not be reached, try again")
  }
  if (!res.ok) throw new Error(`woocommerce answered ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const parsed = schema.safeParse(await res.json())
  if (!parsed.success) throw new Error("woocommerce sent data in a shape this tool does not expect")
  return parsed.data
}
