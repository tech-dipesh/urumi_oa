import { z } from "zod"
import { env } from "@/infra/env"
import { HttpError } from "@/infra/http"
const toolCall = z.object({ id: z.string(), type: z.literal("function"), function: z.object({ name: z.string(), arguments: z.string() }) })
const answer = z.object({ choices: z.array(z.object({ message: z.object({ content: z.string().nullish(), tool_calls: z.array(toolCall).optional() }) })).min(1) })
export type ToolCall = z.output<typeof toolCall>
export interface Message { role: "system" | "user" | "assistant" | "tool"; content: string | null; tool_calls?: ToolCall[]; tool_call_id?: string }
export interface ToolSpec { type: "function"; function: { name: string; description: string; parameters: unknown } }
export async function complete(messages: Message[], tools: ToolSpec[]) {
  if (!env.GROQ_API_KEY) throw new HttpError(503, "chat is not configured, add GROQ_API_KEY")
  const body = { model: env.GROQ_MODEL, messages, ...(tools.length > 0 && { tools, tool_choice: "auto" }) }
  const res = await fetch(`${env.GROQ_URL}/chat/completions`, { method: "POST", headers: { Authorization: `Bearer ${env.GROQ_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(45000) })
  if (!res.ok) throw new HttpError(502, `the language model answered ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const parsed = answer.safeParse(await res.json())
  const message = parsed.success ? parsed.data.choices[0]?.message : undefined
  if (!message) throw new HttpError(502, "the language model sent an answer this gateway does not understand")
  return message
}
