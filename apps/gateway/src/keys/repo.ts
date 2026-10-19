import { db } from "@/db/pool"
import { randomToken, sha256 } from "@/auth/crypto"
import type { AuthUser } from "@/auth/identity"
export interface KeyRow {
  id: string
  user_id: string
  user_email: string
  label: string
  prefix: string
  created_at: Date
  last_used_at: Date | null
  revoked_at: Date | null
}
const cols = "k.id, k.user_id, u.email AS user_email, k.label, k.prefix, k.created_at, k.last_used_at, k.revoked_at"
export const listKeys = async (userId?: string) => (await db.query<KeyRow>(`SELECT ${cols} FROM api_keys k JOIN users u ON u.id = k.user_id WHERE ($1::uuid IS NULL OR k.user_id = $1) ORDER BY k.created_at DESC`, [userId ?? null])).rows
export const getKey = async (id: string) => (await db.query<KeyRow>(`SELECT ${cols} FROM api_keys k JOIN users u ON u.id = k.user_id WHERE k.id = $1`, [id])).rows[0]
export async function createKey(userId: string, label: string) {
  const key = `umk_${randomToken(32)}`
  const res = await db.query<{ id: string }>("INSERT INTO api_keys (user_id, label, prefix, key_hash) VALUES ($1, $2, $3, $4) RETURNING id", [userId, label, key.slice(0, 12), sha256(key)])
  return { id: res.rows[0]?.id, key }
}
export const revokeKey = async (id: string) => (await db.query("UPDATE api_keys SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL", [id])).rowCount
export async function userByKey(key: string) {
  const res = await db.query<AuthUser>("UPDATE api_keys k SET last_used_at = now() FROM users u WHERE k.key_hash = $1 AND k.revoked_at IS NULL AND u.id = k.user_id RETURNING u.id, u.email, u.role", [sha256(key)])
  return res.rows[0]
}
