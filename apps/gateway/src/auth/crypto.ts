import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto"
const derive = (password: string, salt: Buffer, length: number) => new Promise<Buffer>((resolve, reject) => {
  scrypt(password, salt, length, (err, key) => { if (err) reject(err); else resolve(key) })
})
export const sha256 = (text: string) => createHash("sha256").update(text).digest("hex")
export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url")
export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const key = await derive(password, salt, 64)
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`
}
export async function checkPassword(password: string, stored: string) {
  const [, salt, key] = stored.split("$")
  if (!salt || !key) return false
  const expected = Buffer.from(key, "base64")
  const given = await derive(password, Buffer.from(salt, "base64"), expected.length)
  return timingSafeEqual(given, expected)
}
export const dummyHash = await hashPassword("not-a-real-password")
