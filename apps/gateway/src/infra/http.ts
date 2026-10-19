import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from "express"
import { z } from "zod"
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message) }
}
export const validate = (schema: z.ZodType, source: "body" | "params" | "query" = "body") => (req: Request, res: Response, next: NextFunction) => {
  const parsed = schema.safeParse(req[source])
  if (!parsed.success) return res.status(400).json({ error: z.flattenError(parsed.error) })
  if (source === "body") req.body = parsed.data
  next()
}
export const withCatch = <P = Record<string, string>, B = unknown>(fn: (req: Request<P, unknown, B>, res: Response) => Promise<unknown>): RequestHandler<P, unknown, B> => async (req, res, next) => {
  try { await fn(req, res) } catch (err) { next(err) }
}
export const errorHandler: ErrorRequestHandler = (err: Error & { status?: number; code?: string }, _req, res, _next) => {
  if (err.code === "23505") return void res.status(409).json({ error: "that already exists" })
  console.error(err)
  res.status(err.status ?? 500).json({ error: err.status ? err.message : "something went wrong" })
}
