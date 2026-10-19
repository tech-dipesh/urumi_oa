import { Router } from "express"
import { z } from "zod"
import { hashPassword, randomToken } from "@/auth/crypto"
import { userOf } from "@/auth/identity"
import { dropAllSessions } from "@/auth/sessions"
import { HttpError, validate, withCatch } from "@/infra/http"
import { getUser, insertUser, listUsers, removeUser, setPassword } from "@/users/repo"
const inviteBody = z.object({ email: z.email("Please enter a valid email"), role: z.enum(["admin", "member"]).default("member") })
const idParams = z.object({ id: z.uuid() })
const temp = () => randomToken(9)
export const users = Router()
users.get("/", withCatch(async (_req, res) => {
  const rows = await listUsers()
  res.json(rows.map(({ password_hash, active_keys, ...rest }) => ({ ...rest, active_keys: Number(active_keys) })))
}))
users.post("/", validate(inviteBody), withCatch<Record<string, string>, z.output<typeof inviteBody>>(async ({ body }, res) => {
  const password = temp()
  const row = await insertUser(body.email.toLowerCase(), await hashPassword(password), body.role, true)
  if (!row) throw new HttpError(500, "could not create the user")
  res.status(201).json({ id: row.id, email: row.email, role: row.role, temp_password: password, note: "share this password once, the user must change it at first login" })
}))
users.post("/:id/reset", validate(idParams, "params"), withCatch<{ id: string }>(async ({ params: { id } }, res) => {
  if (!(await getUser(id))) throw new HttpError(404, "user not found")
  const password = temp()
  await setPassword(id, await hashPassword(password), true)
  await dropAllSessions(id)
  res.json({ temp_password: password })
}))
users.delete("/:id", validate(idParams, "params"), withCatch<{ id: string }>(async (req, res) => {
  if (req.params.id === userOf(req).id) throw new HttpError(400, "you cannot delete yourself")
  if (!(await removeUser(req.params.id))) throw new HttpError(404, "user not found")
  res.status(204).end()
}))
