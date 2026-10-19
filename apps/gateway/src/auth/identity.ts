import { AsyncLocalStorage } from "node:async_hooks"
import type { Request } from "express"
import { HttpError } from "@/infra/http"
export interface AuthUser { id: string; email: string; role: "admin" | "member" }
const who = new WeakMap<object, AuthUser>()
export const setUser = (req: Request, user: AuthUser) => who.set(req, user)
export const userOf = (req: Request) => {
  const user = who.get(req)
  if (!user) throw new HttpError(401, "unauthorized")
  return user
}
export const mcpUser = new AsyncLocalStorage<AuthUser>()
