import type { McpServer } from "@modelcontextprotocol/server"
import { z } from "zod"
import { woo } from "@/woo"
import { ok } from "@/tools/result"
const order = z.object({
  id: z.number(),
  status: z.string(),
  total: z.string(),
  currency: z.string(),
  date_created: z.string(),
  billing: z.object({ first_name: z.string() }),
  line_items: z.array(z.object({ name: z.string(), quantity: z.number(), total: z.string() })),
})
const trim = (o: z.output<typeof order>) => ({ id: o.id, status: o.status, total: o.total, currency: o.currency, created: o.date_created, customer: o.billing.first_name, items: o.line_items.map(({ name, quantity, total }) => ({ name, quantity, total })) })
const statuses = ["pending", "processing", "on-hold", "completed", "cancelled", "refunded", "failed"] as const
const when = z.iso.datetime({ local: true, offset: true })
export function registerOrders(server: McpServer) {
  server.registerTool("list_orders", {
    description: "List orders, newest first. Use after and before (ISO 8601, like 2026-10-17T00:00:00) to ask for a time range such as today.",
    inputSchema: z.object({
      status: z.enum(["any", ...statuses]).default("any"),
      after: when.optional().describe("only orders created after this time"),
      before: when.optional().describe("only orders created before this time"),
      per_page: z.number().int().min(1).max(50).default(20),
    }),
    annotations: { readOnlyHint: true },
  }, async ({ status, after, before, per_page }) => {
    const rows = await woo("/orders", { query: { status, after, before, per_page } }, z.array(order))
    return ok(rows.map(trim))
  })
  server.registerTool("get_order", {
    description: "Get one order by its id.",
    inputSchema: z.object({ id: z.number().int().positive() }),
    annotations: { readOnlyHint: true },
  }, async ({ id }) => ok(trim(await woo(`/orders/${id}`, {}, order))))
  server.registerTool("update_order_status", {
    description: "Change the status of an order.",
    inputSchema: z.object({ id: z.number().int().positive(), status: z.enum(statuses) }),
  }, async ({ id, status }) => ok(trim(await woo(`/orders/${id}`, { method: "PUT", body: { status } }, order))))
}
