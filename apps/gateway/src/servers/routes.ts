import { Router } from "express"
import { z } from "zod"
import { encrypt } from "@/crypto"
import { HttpError, validate, withCatch } from "@/infra/http"
import { getServer, insertServer, listServers, removeServer, updateServer, type ServerRow } from "@/servers/repo"
import { refresh } from "@/upstream/health"
const name = z.string().regex(/^[a-z][a-z0-9-]{0,30}$/, "name must be lowercase letters, numbers and dashes, like woo")
const url = z.url("Please enter a valid url").refine((value) => /^https?:\/\//.test(value), "url must start with http or https")
const authType = z.enum(["none", "bearer", "header"])
const header = z.string().min(1, "Please enter a header name")
const credential = z.string().min(1, "Please enter a credential")
const authOk = ({ auth_type, auth_header, credential }: { auth_type?: string; auth_header?: string; credential?: string }) => auth_type === undefined || auth_type === "none" || (!!credential && (auth_type === "bearer" || !!auth_header))
const authMessage = "bearer needs a credential, header needs a credential and a header name"
const createBody = z.object({ name, url, auth_type: authType.default("none"), auth_header: header.optional(), credential: credential.optional(), enabled: z.boolean().default(true) }).refine(authOk, authMessage)
const updateBody = z.object({ name: name.optional(), url: url.optional(), auth_type: authType.optional(), auth_header: header.optional(), credential: credential.optional(), enabled: z.boolean().optional() })
const idParams = z.object({ id: z.uuid() })
type Create = z.output<typeof createBody>
type Update = z.output<typeof updateBody>
const publish = (row: ServerRow) => ({ id: row.id, name: row.name, url: row.url, auth_type: row.auth_type, auth_header: row.auth_header, has_credential: row.credential_enc !== null, enabled: row.enabled, status: row.enabled ? row.status : "disabled", reason: row.status_reason, checked_at: row.checked_at, tools: row.tools.map((tool) => ({ name: tool.name, description: tool.description })) })
const fresh = async (row: ServerRow) => {
  if (row.enabled) await refresh(row)
  return publish((await getServer(row.id)) ?? row)
}
export const servers = Router()
servers.get("/", withCatch(async (_req, res) => { res.json((await listServers()).map(publish)) }))
servers.post("/", validate(createBody), withCatch<Record<string, string>, Create>(async ({ body }, res) => {
  const { credential: secret, auth_header, ...rest } = body
  const row = await insertServer({ ...rest, auth_header: auth_header ?? null, credential_enc: secret ? encrypt(secret) : null })
  if (!row) throw new HttpError(500, "could not save the server")
  res.status(201).json(await fresh(row))
}))
servers.patch("/:id", validate(idParams, "params"), validate(updateBody), withCatch<{ id: string }, Update>(async ({ params: { id }, body }, res) => {
  const old = await getServer(id)
  if (!old) throw new HttpError(404, "server not found")
  const auth_type = body.auth_type ?? old.auth_type
  const next = { name: body.name ?? old.name, url: body.url ?? old.url, auth_type, auth_header: body.auth_header ?? old.auth_header, credential_enc: body.credential ? encrypt(body.credential) : old.credential_enc, enabled: body.enabled ?? old.enabled }
  if (!authOk({ auth_type, auth_header: next.auth_header ?? undefined, credential: next.credential_enc ?? undefined })) throw new HttpError(400, authMessage)
  const row = await updateServer(id, next.auth_type === "none" ? { ...next, auth_header: null, credential_enc: null } : next)
  if (!row) throw new HttpError(404, "server not found")
  res.json(await fresh(row))
}))
servers.delete("/:id", validate(idParams, "params"), withCatch<{ id: string }>(async ({ params: { id } }, res) => {
  if (!(await removeServer(id))) throw new HttpError(404, "server not found")
  res.status(204).end()
}))
servers.post("/:id/refresh", validate(idParams, "params"), withCatch<{ id: string }>(async ({ params: { id } }, res) => {
  const row = await getServer(id)
  if (!row) throw new HttpError(404, "server not found")
  res.json(await fresh(row))
}))
