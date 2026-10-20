import { useState } from "react"
import type { SubmitEvent } from "react"
import { useNavigate } from "react-router"
import { api, send } from "@/api"
import { Button, Card, Input, Notice } from "@/ui"
import type { Me } from "@/types"
export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [next, setNext] = useState("")
  const [mustChange, setMustChange] = useState(false)
  const [error, setError] = useState("")
  const go = useNavigate()
  const login = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    try {
      const me = await api<Me>("/api/auth/login", { method: "POST", body: { email, password } })
      if (me.must_change) setMustChange(true)
      else go("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "login failed")
    }
  }
  const change = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    try {
      await send("/api/auth/password", { method: "POST", body: { current: password, next } })
      go("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "could not change the password")
    }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-4 text-xl font-semibold">Urumi MCP gateway</h1>
        <Card title={mustChange ? "Choose a new password" : "Log in"}>
          {error && <Notice kind="error">{error}</Notice>}
          {mustChange ? (
            <form className="flex flex-col gap-3" onSubmit={(e) => void change(e)}>
              <Notice kind="info">You signed in with a temporary password. Pick your own, at least 12 characters.</Notice>
              <Input type="password" placeholder="New password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={12} />
              <Button kind="primary" type="submit">Save password</Button>
            </form>
          ) : (
            <form className="flex flex-col gap-3" onSubmit={(e) => void login(e)}>
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <Button kind="primary" type="submit">Log in</Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
