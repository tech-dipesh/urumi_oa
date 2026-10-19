import pg from "pg"
import { env } from "@/infra/env"
export const db = new pg.Pool({ connectionString: env.DB_URL })
const schema = `
CREATE TABLE IF NOT EXISTS servers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  url text NOT NULL,
  auth_type text NOT NULL DEFAULT 'none' CHECK (auth_type IN ('none', 'bearer', 'header')),
  auth_header text,
  credential_enc text,
  enabled boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'unknown',
  status_reason text,
  tools jsonb NOT NULL DEFAULT '[]',
  checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  must_change boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label text NOT NULL,
  prefix text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);
CREATE TABLE IF NOT EXISTS audit_log (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  user_email text NOT NULL,
  server text,
  tool text NOT NULL,
  source text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  duration_ms integer NOT NULL,
  ok boolean NOT NULL,
  error text
);
CREATE INDEX IF NOT EXISTS audit_log_started_at ON audit_log (started_at DESC);
`
export async function migrate() {
  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      await db.query(schema)
      return
    } catch (err) {
      if (attempt === 30) throw err
      console.log(`database not ready yet (${attempt}/30), retrying`)
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }
}
