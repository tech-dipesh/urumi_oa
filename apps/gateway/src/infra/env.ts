import { z } from "zod"
const req = (name: string) => z.string(`Please enter a ${name}`).min(1, `Please enter a ${name}`)
const seeds = z.array(z.object({ name: z.string(), url: z.url(), tokenEnv: z.string().optional() }))
const schema = z.object({
  DB_URL: req("DB_URL"),
  SECRET_KEY: z.string("Please enter a SECRET_KEY").regex(/^[0-9a-f]{64}$/i, "SECRET_KEY must be 64 hex characters"),
  BOOTSTRAP_TOKEN: req("BOOTSTRAP_TOKEN"),
  PORT: z.coerce.number().default(3000),
  ALLOWED_HOSTS: z.string().default("localhost,127.0.0.1"),
  SEED_SERVERS: z.string().default("[]").transform((raw) => seeds.parse(JSON.parse(raw))),
  CALL_TIMEOUT_MS: z.coerce.number().default(10000),
  LIST_TIMEOUT_MS: z.coerce.number().default(3000),
  HEALTH_INTERVAL_MS: z.coerce.number().default(30000),
})
const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  console.error("please enter these env keys, they are missing or invalid and the server won't work:", Object.keys(z.flattenError(parsed.error).fieldErrors))
  process.exit(1)
}
export const env = parsed.data
