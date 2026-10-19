import { createMcpHandler, Server } from "@modelcontextprotocol/server"
import { mcpUser } from "@/auth/identity"
import { fail, listTools, runTool } from "@/core/tools"
function build() {
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- low level on purpose, we forward other servers tools untouched
  const server = new Server({ name: "urumi-gateway", version: "0.1.0" }, { capabilities: { tools: {} } })
  server.setRequestHandler("tools/list", async () => ({ tools: await listTools() }))
  server.setRequestHandler("tools/call", ({ params }) => {
    const user = mcpUser.getStore()
    return user ? runTool(user, "mcp", params.name, params.arguments) : Promise.resolve(fail("no identity on this request"))
  })
  return server
}
export const mcpHandler = createMcpHandler(build)
