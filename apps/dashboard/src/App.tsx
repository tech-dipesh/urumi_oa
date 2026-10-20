import { useEffect, useState } from "react"
import { NavLink, Navigate, Outlet, useNavigate } from "react-router"
import { api, send } from "@/api"
import { Loading } from "@/ui"
import type { Me } from "@/types"
const link = ({ isActive }: { isActive: boolean }) => `rounded px-3 py-1.5 text-sm ${isActive ? "bg-slate-900 text-white" : "text-slate-700"}`
export default function App() {
  const [me, setMe] = useState<Me | null | undefined>(undefined)
  const go = useNavigate()
  useEffect(() => {
    api<Me>("/api/auth/me").then(setMe, () => setMe(null))
  }, [])
  const logout = async () => {
    await send("/api/auth/logout", { method: "POST" })
    setMe(null)
    go("/login")
  }
  if (me === undefined) return <div className="p-6"><Loading /></div>
  if (me === null || me.must_change) return <Navigate to="/login" replace />
  const admin = me.role === "admin"
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
        <strong className="mr-4">Urumi MCP gateway</strong>
        <NavLink to="/" end className={link}>Chat</NavLink>
        {admin && <NavLink to="/servers" className={link}>Servers</NavLink>}
        {admin && <NavLink to="/members" className={link}>Members</NavLink>}
        <NavLink to="/keys" className={link}>API keys</NavLink>
        {admin && <NavLink to="/audit" className={link}>Audit log</NavLink>}
        <span className="ml-auto text-sm text-slate-600">{me.email} ({me.role})</span>
        <button className="rounded border border-slate-300 px-3 py-1.5 text-sm" onClick={() => void logout()}>Log out</button>
      </header>
      <main className="mx-auto max-w-5xl p-4"><Outlet context={me} /></main>
    </div>
  )
}
