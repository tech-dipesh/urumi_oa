import { db } from "@/db/pool"
import type { AuthUser } from "@/auth/identity"
export interface AuditEntry { user: AuthUser; server: string | null; tool: string; source: "mcp" | "chat"; ms: number; ok: boolean; error: string | null }
export const record = ({ user, server, tool, source, ms, ok, error }: AuditEntry) => db.query("INSERT INTO audit_log (user_id, user_email, server, tool, source, duration_ms, ok, error) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", [user.id, user.email, server, tool, source, ms, ok, error])
export interface AuditRow { id: string; user_email: string; server: string | null; tool: string; source: string; started_at: Date; duration_ms: number; ok: boolean; error: string | null }
export const listAudit = async (limit: number, before?: number) => (await db.query<AuditRow>("SELECT id, user_email, server, tool, source, started_at, duration_ms, ok, error FROM audit_log WHERE ($2::bigint IS NULL OR id < $2) ORDER BY id DESC LIMIT $1", [limit, before ?? null])).rows
