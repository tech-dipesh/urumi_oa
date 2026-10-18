import type { Tool } from "@modelcontextprotocol/server"
import { db } from "@/db/pool"
export interface ServerRow {
  id: string
  name: string
  url: string
  auth_type: "none" | "bearer" | "header"
  auth_header: string | null
  credential_enc: string | null
  enabled: boolean
  status: "unknown" | "connected" | "unreachable"
  status_reason: string | null
  tools: Tool[]
  checked_at: Date | null
  created_at: Date
}
export type Editable = Pick<ServerRow, "name" | "url" | "auth_type" | "auth_header" | "credential_enc" | "enabled">
const q = async (text: string, params: unknown[] = []) => (await db.query<ServerRow>(text, params)).rows
export const listServers = () => q("SELECT * FROM servers ORDER BY created_at")
export const listEnabled = () => q("SELECT * FROM servers WHERE enabled ORDER BY created_at")
export const getServer = async (id: string) => (await q("SELECT * FROM servers WHERE id = $1", [id]))[0]
export const getByName = async (name: string) => (await q("SELECT * FROM servers WHERE name = $1", [name]))[0]
export const insertServer = async ({ name, url, auth_type, auth_header, credential_enc, enabled }: Editable) => (await q("INSERT INTO servers (name, url, auth_type, auth_header, credential_enc, enabled) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", [name, url, auth_type, auth_header, credential_enc, enabled]))[0]
export const updateServer = async (id: string, { name, url, auth_type, auth_header, credential_enc, enabled }: Editable) => (await q("UPDATE servers SET name = $2, url = $3, auth_type = $4, auth_header = $5, credential_enc = $6, enabled = $7 WHERE id = $1 RETURNING *", [id, name, url, auth_type, auth_header, credential_enc, enabled]))[0]
export const removeServer = async (id: string) => (await db.query("DELETE FROM servers WHERE id = $1", [id])).rowCount
export const seedServer = ({ name, url, auth_type, credential_enc }: Pick<ServerRow, "name" | "url" | "auth_type" | "credential_enc">) => db.query("INSERT INTO servers (name, url, auth_type, credential_enc) VALUES ($1, $2, $3, $4) ON CONFLICT (name) DO NOTHING", [name, url, auth_type, credential_enc])
export const setStatus = (id: string, status: ServerRow["status"], reason: string | null, tools?: Tool[]) => db.query("UPDATE servers SET status = $2, status_reason = $3, tools = COALESCE($4::jsonb, tools), checked_at = now() WHERE id = $1", [id, status, reason, tools ? JSON.stringify(tools) : null])
