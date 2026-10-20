export interface Me { id: string; email: string; role: "admin" | "member"; must_change: boolean }
export interface Tool { name: string; description?: string }
export interface Server { id: string; name: string; url: string; auth_type: "none" | "bearer" | "header"; auth_header: string | null; has_credential: boolean; enabled: boolean; status: "unknown" | "connected" | "unreachable" | "disabled"; reason: string | null; checked_at: string | null; tools: Tool[] }
export interface Member { id: string; email: string; role: "admin" | "member"; must_change: boolean; active_keys: number; created_at: string }
export interface Key { id: string; user_id: string; user_email: string; label: string; prefix: string; created_at: string; last_used_at: string | null; revoked_at: string | null }
export interface AuditRow { id: string; user_email: string; server: string | null; tool: string; source: string; started_at: string; duration_ms: number; ok: boolean; error: string | null }
export interface Trace { name: string; args: unknown; ok: boolean; ms: number }
