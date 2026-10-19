import type { NextFunction, Request, Response } from "express"
import { setUser, userOf } from "@/auth/identity"
import { userBySession } from "@/auth/sessions"
import { userByKey } from "@/keys/repo"
export const cookieOf = (req: Request, name: string) => {
  const parts = (req.headers.cookie ?? "").split(";").map((part) => part.trim().split("="))
  return parts.find(([key]) => key === name)?.[1]
}
export async function sessionAuth(req: Request, res: Response, next: NextFunction) {
  const token = cookieOf(req, "sid")
  const user = token ? await userBySession(token) : undefined
  if (!user) return void res.status(401).json({ error: "please log in" })
  const { origin } = req.headers
  const foreign = origin && req.method !== "GET" && (!URL.canParse(origin) || new URL(origin).host !== req.headers.host)
  if (foreign) return void res.status(403).json({ error: "bad origin" })
  setUser(req, user)
  next()
}
export async function keyAuth(req: Request, res: Response, next: NextFunction) {
  const key = req.headers.authorization?.replace(/^Bearer /i, "")
  const user = key ? await userByKey(key) : undefined
  if (!user) return void res.status(401).json({ error: "unauthorized" })
  setUser(req, user)
  next()
}
export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  if (userOf(req).role !== "admin") return void res.status(403).json({ error: "admins only" })
  next()
}
