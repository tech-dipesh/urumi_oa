import { Router } from "express"
import { z } from "zod"
import { userOf } from "@/auth/identity"
import { HttpError, validate, withCatch } from "@/infra/http"
import { createKey, getKey, listKeys, revokeKey } from "@/keys/repo"
import { getUser } from "@/users/repo"
const createBody = z.object({ label: z.string("Please enter a label").min(1, "Please enter a label").max(60), user_id: z.uuid().optional() })
const idParams = z.object({ id: z.uuid() })
export const keys = Router()
keys.get("/", withCatch(async (req, res) => {
  const me = userOf(req)
  res.json(await listKeys(me.role === "admin" ? undefined : me.id))
}))
keys.post("/", validate(createBody), withCatch<Record<string, string>, z.output<typeof createBody>>(async (req, res) => {
  const me = userOf(req)
  const owner = req.body.user_id ?? me.id
  if (owner !== me.id && me.role !== "admin") throw new HttpError(403, "only admins can issue keys for others")
  if (!(await getUser(owner))) throw new HttpError(404, "user not found")
  const { id, key } = await createKey(owner, req.body.label)
  res.status(201).json({ id, key, label: req.body.label, user_id: owner, note: "copy this key now, it is shown only once" })
}))
keys.delete("/:id", validate(idParams, "params"), withCatch<{ id: string }>(async (req, res) => {
  const me = userOf(req)
  const key = await getKey(req.params.id)
  if (!key) throw new HttpError(404, "key not found")
  if (key.user_id !== me.id && me.role !== "admin") throw new HttpError(403, "not your key")
  await revokeKey(key.id)
  res.status(204).end()
}))
