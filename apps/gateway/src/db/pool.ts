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
