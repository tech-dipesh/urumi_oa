import { z } from "zod"
const schema = z.object({
  PORT: z.coerce.number().default(3000),
  ALLOWED_HOSTS: z.string().default("localhost,127.0.0.1"),
})
export const env = schema.parse(process.env)
