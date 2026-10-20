import { useState } from "react"
import type { SubmitEvent } from "react"
import { useOutletContext } from "react-router"
import { api, send, useLoad } from "@/api"
import { Button, Card, Empty, Input, Loading, Notice, Select, when } from "@/ui"
import type { Me, Member } from "@/types"
export default function Members() {
  const me = useOutletContext<Me>()
  const { data, error, loading, reload } = useLoad<Member[]>("/api/users")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("member")
  const [shown, setShown] = useState("")
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
  const invite = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    void run(async () => {
      const made = await api<{ email: string; temp_password: string }>("/api/users", { method: "POST", body: { email, role } })
      setShown(`${made.email} can sign in with the temporary password ${made.temp_password}. It is shown only now, and they must change it at first login.`)
      setEmail("")
    })
  }
  const reset = (member: Member) => run(async () => {
    const made = await api<{ temp_password: string }>(`/api/users/${member.id}/reset`, { method: "POST" })
    setShown(`${member.email} has a new temporary password: ${made.temp_password}. It is shown only now.`)
  })
  return (
    <>
      <Card title="Team members">
        {problem && <Notice kind="error">{problem}</Notice>}
        {shown && <Notice kind="info">{shown}</Notice>}
        {loading && <Loading />}
        {error && <Notice kind="error">{error}</Notice>}
        {data?.length === 0 && <Empty>No members yet.</Empty>}
        {data && data.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-slate-200 text-slate-500"><th className="py-1">Email</th><th>Role</th><th>Active keys</th><th>Joined</th><th></th></tr></thead>
            <tbody>
              {data.map((member) => (
                <tr key={member.id} className="border-b border-slate-100">
                  <td className="py-2">{member.email}{member.must_change ? " (has not set a password yet)" : ""}</td>
                  <td>{member.role}</td>
                  <td>{member.active_keys}</td>
                  <td>{when(member.created_at)}</td>
                  <td className="flex justify-end gap-2 py-1">
                    <Button onClick={() => void reset(member)}>Reset password</Button>
                    <Button kind="danger" disabled={member.id === me.id} onClick={() => { if (confirm(`Remove ${member.email} and revoke their keys?`)) void run(() => send(`/api/users/${member.id}`, { method: "DELETE" })) }}>Remove</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <Card title="Invite a member">
        <form className="flex flex-wrap gap-2" onSubmit={invite}>
          <Input type="email" className="min-w-64 flex-1" placeholder="teammate@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="member">member</option>
            <option value="admin">admin</option>
          </Select>
          <Button kind="primary" type="submit">Invite</Button>
        </form>
        <p className="mt-2 text-xs text-slate-500">No email is sent. Share the temporary password yourself.</p>
      </Card>
    </>
  )
}
