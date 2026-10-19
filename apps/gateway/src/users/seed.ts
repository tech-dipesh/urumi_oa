import { hashPassword } from "@/auth/crypto"
import { env } from "@/infra/env"
import { countUsers, insertUser } from "@/users/repo"
export async function seedAdmin() {
  if ((await countUsers()) > 0) return
  await insertUser(env.ADMIN_EMAIL.toLowerCase(), await hashPassword(env.ADMIN_PASSWORD), "admin", false)
  console.log(`first admin created: ${env.ADMIN_EMAIL}`)
}
