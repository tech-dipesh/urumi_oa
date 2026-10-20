import { useState } from "react"
import type { SubmitEvent } from "react"
import { useOutletContext } from "react-router"
import { api, send, useLoad } from "@/api"
import { Button, Card, Empty, Input, Loading, Notice, Select, when } from "@/ui"
import type { Key, Me, Member } from "@/types"
function Owner({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { data } = useLoad<Member[]>("/api/users")
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">for me</option>
      {data?.map((member) => <option key={member.id} value={member.id}>{member.email}</option>)}
    </Select>
  )
}
export default function Keys() {
  const me = useOutletContext<Me>()
  const { data, error, loading, reload } = useLoad<Key[]>("/api/keys")
  const [label, setLabel] = useState("")
  const [owner, setOwner] = useState("")
  const [fresh, setFresh] = useState("")
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
  const create = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    void run(async () => {
      const made = await api<{ key: string }>("/api/keys", { method: "POST", body: { label, ...(owner && { user_id: owner }) } })
      setFresh(made.key)
      setLabel("")
    })
  }
  const admin = me.role === "admin"
  return (
    <>
      {fresh && (
        <Card title="Copy your new key now">
          <Notice kind="info">This key is shown only once and stored hashed. Add the gateway to an MCP client with it:</Notice>
          <pre className="overflow-x-auto rounded bg-slate-900 p-3 text-xs text-white">{`claude mcp add --transport http urumi ${window.location.origin}/mcp --header "Authorization: Bearer ${fresh}"`}</pre>
          <p className="mt-2 break-all font-mono text-xs">{fresh}</p>
        </Card>
      )}
      <Card title={admin ? "All API keys" : "Your API keys"}>
        {problem && <Notice kind="error">{problem}</Notice>}
        {loading && <Loading />}
        {error && <Notice kind="error">{error}</Notice>}
        {data?.length === 0 && <Empty>No keys yet.</Empty>}
        {data && data.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-slate-200 text-slate-500"><th className="py-1">Owner</th><th>Label</th><th>Key starts with</th><th>Created</th><th>Last used</th><th>State</th><th></th></tr></thead>
            <tbody>
              {data.map((key) => (
                <tr key={key.id} className="border-b border-slate-100">
                  <td className="py-2">{key.user_email}</td>
                  <td>{key.label}</td>
                  <td className="font-mono text-xs">{key.prefix}</td>
                  <td>{when(key.created_at)}</td>
                  <td>{when(key.last_used_at)}</td>
                  <td>{key.revoked_at ? "revoked" : "active"}</td>
                  <td className="text-right">{!key.revoked_at && <Button kind="danger" onClick={() => { if (confirm("Revoke this key? Clients using it stop working right away.")) void run(() => send(`/api/keys/${key.id}`, { method: "DELETE" })) }}>Revoke</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <Card title="Create a key">
        <form className="flex flex-wrap gap-2" onSubmit={create}>
          <Input className="min-w-56 flex-1" placeholder="label, like my laptop" value={label} onChange={(e) => setLabel(e.target.value)} required maxLength={60} />
          {admin && <Owner value={owner} onChange={setOwner} />}
          <Button kind="primary" type="submit">Create key</Button>
        </form>
      </Card>
    </>
  )
}
