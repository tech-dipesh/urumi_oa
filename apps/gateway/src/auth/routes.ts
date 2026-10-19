import { Router } from "express"
import { z } from "zod"
import { checkPassword, dummyHash, hashPassword } from "@/auth/crypto"
import { userOf } from "@/auth/identity"
import { cookieOf, sessionAuth } from "@/auth/middleware"
import { createSession, dropOtherSessions, dropSession } from "@/auth/sessions"
import { env } from "@/infra/env"
import { HttpError, validate, withCatch } from "@/infra/http"
import { getByEmail, getUser, setPassword, type UserRow } from "@/users/repo"
const loginBody = z.object({ email: z.email("Please enter a valid email"), password: z.string("Please enter a password").min(1, "Please enter a password") })
const changeBody = z.object({ current: z.string("Please enter your current password").min(1), next: z.string("Please enter a new password").min(12, "new password needs at least 12 characters") })
const fails = new Map<string, { count: number; until: number }>()
const cookie = (value: string, maxAge: number) => `sid=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${env.COOKIE_SECURE ? "; Secure" : ""}`
const view = ({ id, email, role, must_change }: UserRow) => ({ id, email, role, must_change })
export const auth = Router()
auth.post("/login", validate(loginBody), withCatch<Record<string, string>, z.output<typeof loginBody>>(async ({ body }, res) => {
  const email = body.email.toLowerCase()
  const known = fails.get(email)
  const recent = known && known.until > Date.now() ? known : undefined
  if (recent && recent.count >= 5) throw new HttpError(429, "too many tries, wait a few minutes")
  const user = await getByEmail(email)
  const same = await checkPassword(body.password, user?.password_hash ?? dummyHash)
  if (!user || !same) {
    fails.set(email, { count: (recent?.count ?? 0) + 1, until: Date.now() + 5 * 60_000 })
    throw new HttpError(401, "wrong email or password")
  }
  fails.delete(email)
  const { token, maxAge } = await createSession(user.id)
  res.setHeader("Set-Cookie", cookie(token, maxAge))
  res.json(view(user))
}))
auth.post("/logout", sessionAuth, withCatch(async (req, res) => {
  const token = cookieOf(req, "sid")
  if (token) await dropSession(token)
  res.setHeader("Set-Cookie", cookie("", 0))
  res.status(204).end()
}))
auth.get("/me", sessionAuth, withCatch(async (req, res) => {
  const user = await getUser(userOf(req).id)
  if (!user) throw new HttpError(401, "please log in")
  res.json(view(user))
}))
auth.post("/password", sessionAuth, validate(changeBody), withCatch<Record<string, string>, z.output<typeof changeBody>>(async (req, res) => {
  const user = await getUser(userOf(req).id)
  if (!user || !(await checkPassword(req.body.current, user.password_hash))) throw new HttpError(400, "current password is wrong")
  await setPassword(user.id, await hashPassword(req.body.next), false)
  await dropOtherSessions(user.id, cookieOf(req, "sid") ?? "")
  res.status(204).end()
}))
