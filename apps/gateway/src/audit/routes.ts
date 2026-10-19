import { Router } from "express"
import { z } from "zod"
import { listAudit } from "@/audit/repo"
import { validate, withCatch } from "@/infra/http"
const query = z.object({ limit: z.coerce.number().int().min(1).max(200).default(50), before: z.coerce.number().int().positive().optional() })
export const audit = Router()
audit.get("/", validate(query, "query"), withCatch(async (req, res) => {
  const { limit, before } = query.parse(req.query)
  res.json(await listAudit(limit, before))
}))
