import { Router } from "express"
import { z } from "zod"
import { userOf } from "@/auth/identity"
import { chat } from "@/chat/agent"
import { validate, withCatch } from "@/infra/http"
const body = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) })).min(1).max(30),
}).refine(({ messages }) => messages.at(-1)?.role === "user", "the last message must come from the user")
export const chatRoutes = Router()
chatRoutes.post("/", validate(body), withCatch<Record<string, string>, z.output<typeof body>>(async (req, res) => {
  res.json(await chat(userOf(req), req.body.messages))
}))
