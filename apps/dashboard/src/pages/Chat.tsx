import { useState } from "react"
import type { SubmitEvent } from "react"
import { api } from "@/api"
import { Button, Card, Input, Notice } from "@/ui"
import type { Trace } from "@/types"
interface Turn { role: "user" | "assistant"; content: string; tools?: Trace[] }
export default function Chat() {
  const [turns, setTurns] = useState<Turn[]>([])
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const ask = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const question = text.trim()
    if (!question) return
    const next: Turn[] = [...turns, { role: "user", content: question }]
    setTurns(next)
    setText("")
    setBusy(true)
    setError("")
    try {
      const answer = await api<{ reply: string; tools: Trace[] }>("/api/chat", { method: "POST", body: { messages: next.map(({ role, content }) => ({ role, content })) } })
      setTurns([...next, { role: "assistant", content: answer.reply || "(no answer)", tools: answer.tools }])
    } catch (err) {
      setError(err instanceof Error ? err.message : "the chat failed")
    } finally {
      setBusy(false)
    }
  }
  return (
    <Card title="Chat with your tools">
      <p className="mb-3 text-sm text-slate-600">Ask about orders, products, notes or the time. Every tool call goes through the gateway as you, and shows up in the audit log.</p>
      {turns.length === 0 && <p className="mb-3 text-sm text-slate-500">Try: what orders came in today? Or: create a product called Tea cup for 149.</p>}
      <div className="mb-3 flex flex-col gap-3">
        {turns.map((turn, i) => (
          <div key={i} className={turn.role === "user" ? "self-end rounded bg-slate-900 px-3 py-2 text-sm text-white" : "rounded border border-slate-200 px-3 py-2 text-sm"}>
            <p className="whitespace-pre-wrap">{turn.content}</p>
            {turn.tools && turn.tools.length > 0 && (
              <ul className="mt-2 border-t border-slate-200 pt-2 font-mono text-xs text-slate-600">
                {turn.tools.map((tool, j) => (
                  <li key={j}>{tool.ok ? "ok" : "failed"} {tool.name}({JSON.stringify(tool.args)}) {tool.ms}ms</li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {busy && <p className="text-sm text-slate-500">Thinking and calling tools...</p>}
      </div>
      {error && <Notice kind="error">{error}</Notice>}
      <form className="flex gap-2" onSubmit={(e) => void ask(e)}>
        <Input className="flex-1" placeholder="Ask something" value={text} onChange={(e) => setText(e.target.value)} disabled={busy} />
        <Button kind="primary" type="submit" disabled={busy}>Send</Button>
      </form>
    </Card>
  )
}
