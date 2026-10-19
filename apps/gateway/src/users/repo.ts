import { db } from "@/db/pool"
export interface UserRow {
  id: string
  email: string
  password_hash: string
  role: "admin" | "member"
  must_change: boolean
  created_at: Date
}
const q = async (text: string, params: unknown[] = []) => (await db.query<UserRow>(text, params)).rows
export const listUsers = () => db.query<UserRow & { active_keys: string }>("SELECT u.*, (SELECT count(*) FROM api_keys k WHERE k.user_id = u.id AND k.revoked_at IS NULL) AS active_keys FROM users u ORDER BY u.created_at").then((res) => res.rows)
export const getUser = async (id: string) => (await q("SELECT * FROM users WHERE id = $1", [id]))[0]
export const getByEmail = async (email: string) => (await q("SELECT * FROM users WHERE email = $1", [email]))[0]
export const countUsers = async () => Number((await db.query<{ n: string }>("SELECT count(*) AS n FROM users")).rows[0]?.n ?? 0)
export const insertUser = async (email: string, passwordHash: string, role: UserRow["role"], mustChange: boolean) => (await q("INSERT INTO users (email, password_hash, role, must_change) VALUES ($1, $2, $3, $4) RETURNING *", [email, passwordHash, role, mustChange]))[0]
export const setPassword = (id: string, passwordHash: string, mustChange: boolean) => db.query("UPDATE users SET password_hash = $2, must_change = $3 WHERE id = $1", [id, passwordHash, mustChange])
export const removeUser = async (id: string) => (await db.query("DELETE FROM users WHERE id = $1", [id])).rowCount
