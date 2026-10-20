import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react"
const base = "rounded border px-3 py-1.5 text-sm"
export const Card = ({ title, children }: { title?: string; children: ReactNode }) => (
  <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
    {title && <h2 className="mb-3 text-base font-semibold text-slate-800">{title}</h2>}
    {children}
  </section>
)
export const Button = ({ kind = "plain", className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { kind?: "plain" | "primary" | "danger" }) => {
  const look = kind === "primary" ? "border-slate-900 bg-slate-900 text-white" : kind === "danger" ? "border-red-300 text-red-700" : "border-slate-300 text-slate-700"
  return <button className={`${base} ${look} disabled:opacity-50 ${className}`} {...rest} />
}
export const Input = ({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) => <input className={`${base} border-slate-300 ${className}`} {...rest} />
export const Select = ({ className = "", ...rest }: SelectHTMLAttributes<HTMLSelectElement>) => <select className={`${base} border-slate-300 bg-white ${className}`} {...rest} />
export const Notice = ({ kind, children }: { kind: "error" | "info"; children: ReactNode }) => (
  <p className={`mb-3 rounded border px-3 py-2 text-sm ${kind === "error" ? "border-red-300 bg-red-50 text-red-800" : "border-sky-300 bg-sky-50 text-sky-900"}`}>{children}</p>
)
export const Loading = () => <p className="text-sm text-slate-500">Loading...</p>
export const Empty = ({ children }: { children: ReactNode }) => <p className="text-sm text-slate-500">{children}</p>
export const Badge = ({ status }: { status: string }) => {
  const look = status === "connected" ? "bg-green-100 text-green-800" : status === "unreachable" ? "bg-red-100 text-red-800" : "bg-slate-200 text-slate-700"
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${look}`}>{status}</span>
}
export const when = (value: string | null) => (value ? new Date(value).toLocaleString() : "never")
