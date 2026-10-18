import { encrypt } from "@/crypto"
import { env } from "@/infra/env"
import { seedServer } from "@/servers/repo"
export async function seed() {
  for (const { name, url, tokenEnv } of env.SEED_SERVERS) {
    const token = tokenEnv ? process.env[tokenEnv] : undefined
    await seedServer({ name, url, auth_type: token ? "bearer" : "none", credential_enc: token ? encrypt(token) : null })
  }
}
