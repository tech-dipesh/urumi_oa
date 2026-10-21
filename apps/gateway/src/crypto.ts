import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"
import { env } from "@/infra/env"
const key = Buffer.from(env.SECRET_KEY, "hex")
export function encrypt(text: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const body = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])
  return [iv, cipher.getAuthTag(), body].map((part) => part.toString("base64")).join(".")
}
export function decrypt(blob: string) {
  const [iv, tag, body] = blob.split(".").map((part) => Buffer.from(part, "base64"))
  if (!iv || !tag || !body) throw new Error("stored credential is corrupted")
  const decipher = createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8")
}
