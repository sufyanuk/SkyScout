/**
 * Build-time database step: apply migrations, then seed reference data.
 *
 * If the target database already contains tables that aren't managed by these
 * migrations (Prisma error P3005 — e.g. DATABASE_URL still points at another
 * app's database), nothing is changed:
 *  - production deployments fail with an explanation;
 *  - preview/local builds continue so the UI can still be reviewed with mock
 *    flight data (accounts, favourites and alerts won't work until a dedicated
 *    database is configured).
 */
import { spawnSync } from "node:child_process";

try {
  process.loadEnvFile(); // local .env; on Vercel variables come from the environment
} catch {
  // no .env file
}

function run(args) {
  const result = spawnSync("npx", ["prisma", ...args], { encoding: "utf8", shell: process.platform === "win32" });
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
  return { ok: result.status === 0, output: `${result.stdout}\n${result.stderr}` };
}

if (!process.env.DATABASE_URL) {
  console.warn("[db-deploy] DATABASE_URL is not set — skipping migrations and seed.");
  process.exit(0);
}

const migrate = run(["migrate", "deploy"]);
if (!migrate.ok) {
  const foreignSchema = migrate.output.includes("P3005");
  const isProduction = process.env.VERCEL_ENV === "production";
  if (foreignSchema) {
    console.error(
      "\n[db-deploy] The database in DATABASE_URL already contains tables that SkyScout's migrations don't manage (P3005).\n" +
        "            It is probably another app's database. Nothing was changed.\n" +
        "            Fix: point DATABASE_URL at a new, empty PostgreSQL database for SkyScout.\n",
    );
    if (!isProduction) {
      console.warn("[db-deploy] Non-production build: continuing without database setup (mock flight data still works).\n");
      process.exit(0);
    }
  }
  process.exit(1);
}

if (!run(["db", "seed"]).ok) process.exit(1);
