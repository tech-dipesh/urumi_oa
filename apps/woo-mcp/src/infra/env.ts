import { z } from "zod"
const req = (name: string) => z.string(`Please enter a ${name}`).min(1, `Please enter a ${name}`)
const schema = z.object({
  WOO_URL: z.url("Please enter a valid WOO_URL"),
  WOO_CONSUMER_KEY: req("WOO_CONSUMER_KEY"),
  WOO_CONSUMER_SECRET: req("WOO_CONSUMER_SECRET"),
  MCP_TOKEN: req("MCP_TOKEN"),
  PORT: z.coerce.number().default(3000),
  ALLOWED_HOSTS: z.string().default("localhost,127.0.0.1"),
})
const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  console.error("please enter these env keys, they are missing or invalid and the server won't work:", Object.keys(z.flattenError(parsed.error).fieldErrors))
  process.exit(1)
}
export const env = parsed.data
