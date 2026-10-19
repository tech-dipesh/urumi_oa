import type { McpServer } from "@modelcontextprotocol/server"
import { z } from "zod"
import { woo } from "@/woo"
import { ok } from "@/tools/result"
const product = z.object({ id: z.number(), name: z.string(), status: z.string(), sku: z.string(), price: z.string(), stock_status: z.string(), stock_quantity: z.number().nullable(), permalink: z.string() })
const trim = (p: z.output<typeof product>) => ({ id: p.id, name: p.name, price: p.price, status: p.status, sku: p.sku, stock: p.stock_quantity ?? p.stock_status, url: p.permalink })
export function registerProducts(server: McpServer) {
  server.registerTool("list_products", {
    description: "List products in the store, newest first. Optional text search and status filter.",
    inputSchema: z.object({
      search: z.string().optional().describe("text to look for in product names"),
      status: z.enum(["any", "publish", "draft", "private", "pending"]).default("any"),
      per_page: z.number().int().min(1).max(50).default(20),
    }),
    annotations: { readOnlyHint: true },
  }, async ({ search, status, per_page }) => {
    const rows = await woo("/products", { query: { search, status, per_page } }, z.array(product))
    return ok(rows.map(trim))
  })
  server.registerTool("create_product", {
    description: "Create a simple product. It is published right away unless status is draft.",
    inputSchema: z.object({
      name: z.string().min(1),
      price: z.number().min(0).describe("regular price in the store currency"),
      description: z.string().optional(),
      sku: z.string().optional(),
      stock_quantity: z.number().int().min(0).optional().describe("set to track stock"),
      status: z.enum(["publish", "draft"]).default("publish"),
    }),
  }, async ({ name, price, description, sku, stock_quantity, status }) => {
    const stock = stock_quantity === undefined ? {} : { manage_stock: true, stock_quantity }
    const created = await woo("/products", { method: "POST", body: { name, type: "simple", regular_price: String(price), description, sku, status, ...stock } }, product)
    return ok(trim(created))
  })
}
