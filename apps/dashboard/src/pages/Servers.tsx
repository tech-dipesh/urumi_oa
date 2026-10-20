import { useState } from "react"
import type { SubmitEvent } from "react"
import { send, useLoad } from "@/api"
import { Badge, Button, Card, Empty, Input, Loading, Notice, Select, when } from "@/ui"
import type { Server } from "@/types"
interface Form { name: string; url: string; auth_type: Server["auth_type"]; auth_header: string; credential: string }
const blank: Form = { name: "", url: "", auth_type: "none", auth_header: "", credential: "" }
const body = (form: Form) => ({
  ...(form.name && { name: form.name }),
  ...(form.url && { url: form.url }),
  auth_type: form.auth_type,
  ...(form.auth_type === "header" && form.auth_header && { auth_header: form.auth_header }),
  ...(form.auth_type !== "none" && form.credential && { credential: form.credential }),
})
function Fields({ form, setForm, editing }: { form: Form; setForm: (form: Form) => void; editing: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {!editing && <Input placeholder="name, like weather" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />}
      <Input className="min-w-64 flex-1" placeholder="https://server.example/mcp" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
      <Select value={form.auth_type} onChange={(e) => setForm({ ...form, auth_type: e.target.value as Form["auth_type"] })}>
        <option value="none">no credential</option>
        <option value="bearer">bearer token</option>
        <option value="header">custom header</option>
      </Select>
      {form.auth_type === "header" && <Input placeholder="header name" value={form.auth_header} onChange={(e) => setForm({ ...form, auth_header: e.target.value })} />}
      {form.auth_type !== "none" && <Input type="password" placeholder={editing ? "new credential (empty keeps the old)" : "credential"} value={form.credential} onChange={(e) => setForm({ ...form, credential: e.target.value })} />}
    </div>
  )
}
export default function Servers() {
  const { data, error, loading, reload } = useLoad<Server[]>("/api/servers")
  const [form, setForm] = useState<Form>(blank)
  const [editId, setEditId] = useState("")
  const [edit, setEdit] = useState<Form>(blank)
  const [problem, setProblem] = useState("")
  const run = async (job: () => Promise<void>) => {
    setProblem("")
    try {
      await job()
      reload()
    } catch (err) {
      setProblem(err instanceof Error ? err.message : "that did not work")
    }
  }
  const add = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    void run(async () => {
      await send("/api/servers", { method: "POST", body: body(form) })
      setForm(blank)
    })
  }
  const save = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    void run(async () => {
      await send(`/api/servers/${editId}`, { method: "PATCH", body: body(edit) })
      setEditId("")
    })
  }
  const startEdit = (server: Server) => {
    setEditId(server.id)
    setEdit({ name: server.name, url: server.url, auth_type: server.auth_type, auth_header: server.auth_header ?? "", credential: "" })
  }
  return (
    <>
      <Card title="MCP servers">
        {problem && <Notice kind="error">{problem}</Notice>}
        {loading && <Loading />}
        {error && <Notice kind="error">{error}</Notice>}
        {data?.length === 0 && <Empty>No servers yet. Add one below.</Empty>}
        <div className="flex flex-col gap-3">
          {data?.map((server) => (
            <div key={server.id} className="rounded border border-slate-200 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <strong>{server.name}</strong>
                <Badge status={server.status} />
                <span className="text-xs text-slate-500">{server.url}</span>
                <span className="ml-auto flex gap-2">
                  <Button onClick={() => void run(() => send(`/api/servers/${server.id}`, { method: "PATCH", body: { enabled: !server.enabled } }))}>{server.enabled ? "Disable" : "Enable"}</Button>
                  <Button onClick={() => void run(() => send(`/api/servers/${server.id}/refresh`, { method: "POST" }))}>Check now</Button>
                  <Button onClick={() => (editId === server.id ? setEditId("") : startEdit(server))}>Edit</Button>
                  <Button kind="danger" onClick={() => { if (confirm(`Remove ${server.name}?`)) void run(() => send(`/api/servers/${server.id}`, { method: "DELETE" })) }}>Remove</Button>
                </span>
              </div>
              {server.reason && server.status === "unreachable" && <p className="mt-1 text-sm text-red-700">Why: {server.reason}</p>}
              <p className="mt-1 text-xs text-slate-500">Last check: {when(server.checked_at)}. Credential: {server.has_credential ? "stored on the server, never shown" : "none"}</p>
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer">{server.tools.length} tools</summary>
                <ul className="mt-1 list-disc pl-5 text-slate-700">
                  {server.tools.map((tool) => <li key={tool.name}><code>{server.name}__{tool.name}</code> {tool.description}</li>)}
                </ul>
              </details>
              {editId === server.id && (
                <form className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3" onSubmit={save}>
                  <Fields form={edit} setForm={setEdit} editing />
                  <div><Button kind="primary" type="submit">Save changes</Button></div>
                </form>
              )}
            </div>
          ))}
        </div>
      </Card>
      <Card title="Add a server">
        <form className="flex flex-col gap-2" onSubmit={add}>
          <Fields form={form} setForm={setForm} editing={false} />
          <div><Button kind="primary" type="submit">Add server</Button></div>
        </form>
        <p className="mt-2 text-xs text-slate-500">The name becomes the tool prefix, like weather__get_forecast. Credentials are encrypted and only the gateway can read them.</p>
      </Card>
    </>
  )
}
