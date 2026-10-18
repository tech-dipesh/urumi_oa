import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client"
import { decrypt } from "@/crypto"
import type { ServerRow } from "@/servers/repo"
const headersFor = ({ auth_type, auth_header, credential_enc }: ServerRow): Record<string, string> => {
  if (auth_type === "none" || !credential_enc) return {}
  const secret = decrypt(credential_enc)
  return auth_type === "bearer" ? { Authorization: `Bearer ${secret}` } : { [auth_header ?? "Authorization"]: secret }
}
export function describe(err: unknown, ms: number) {
  if (!(err instanceof Error)) return "unknown error"
  if (err.name === "TimeoutError" || err.name === "AbortError") return `did not answer within ${ms}ms`
  const code = err.cause instanceof Error && "code" in err.cause ? String(err.cause.code) : ""
  return code ? `${err.message} (${code})` : err.message
}
export async function withClient<T>(row: ServerRow, ms: number, run: (client: Client, signal: AbortSignal) => Promise<T>) {
  const signal = AbortSignal.timeout(ms)
  const client = new Client({ name: "urumi-gateway", version: "0.1.0" })
  const transport = new StreamableHTTPClientTransport(new URL(row.url), { requestInit: { headers: headersFor(row), signal } })
  let timer: NodeJS.Timeout | undefined
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => { reject(new DOMException("deadline", "TimeoutError")) }, ms)
  })
  const work = (async () => {
    await client.connect(transport)
    return run(client, signal)
  })()
  try {
    return await Promise.race([work, deadline])
  } finally {
    clearTimeout(timer)
    void client.close().catch(() => undefined)
  }
}
