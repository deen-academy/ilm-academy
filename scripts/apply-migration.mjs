// Applies a single SQL migration file to the connected Supabase Postgres.
// Usage: node --env-file-if-exists=/vercel/share/.env.project scripts/apply-migration.mjs <path-to-sql>
import { readFileSync } from "node:fs";
import pg from "pg";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/apply-migration.mjs <path-to-sql>");
  process.exit(1);
}

const sql = readFileSync(file, "utf8");
// Strip sslmode from the URL so the explicit ssl config below takes effect
// (Supabase pooler certs are not in the default CA chain in this sandbox).
const rawUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
const connectionString = rawUrl.replace(/([?&])sslmode=[^&]*&?/, "$1").replace(/[?&]$/, "");
const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query("BEGIN");
  await client.query(sql);
  await client.query("COMMIT");
  console.log(`[v0] Applied: ${file}`);
} catch (err) {
  await client.query("ROLLBACK").catch(() => {});
  console.error(`[v0] FAILED: ${file}`);
  console.error(err.message);
  process.exit(1);
} finally {
  await client.end();
}
