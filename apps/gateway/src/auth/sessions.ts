import { db } from "@/db/pool"
import { randomToken, sha256 } from "@/auth/crypto"
import type { AuthUser } from "@/auth/identity"
const week = 7 * 24 * 60 * 60
export async function createSession(userId: string) {
  const token = randomToken()
  await db.query("DELETE FROM sessions WHERE expires_at < now()")
  await db.query("INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, now() + make_interval(secs => $3))", [userId, sha256(token), week])
  return { token, maxAge: week }
}
export const dropSession = (token: string) => db.query("DELETE FROM sessions WHERE token_hash = $1", [sha256(token)])
export const dropOtherSessions = (userId: string, token: string) => db.query("DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2", [userId, sha256(token)])
export const dropAllSessions = (userId: string) => db.query("DELETE FROM sessions WHERE user_id = $1", [userId])
export async function userBySession(token: string) {
  const res = await db.query<AuthUser>("SELECT u.id, u.email, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > now()", [sha256(token)])
  return res.rows[0]
}
