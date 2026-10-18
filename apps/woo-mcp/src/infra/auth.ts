import { timingSafeEqual } from "node:crypto"
import type { NextFunction, Request, Response } from "express"
import { env } from "@/infra/env"
const expected = Buffer.from(env.MCP_TOKEN)
export const auth = (req: Request, res: Response, next: NextFunction) => {
  const given = Buffer.from(req.headers.authorization?.replace(/^Bearer /i, "") ?? "")
  const same = given.length === expected.length && timingSafeEqual(given, expected)
  if (!same) return res.status(401).json({ error: "unauthorized" })
  next()
}
