import { defineConfig } from "prisma/config";

// Prisma CLI no longer auto-loads .env when a config file exists; load it here
// for local development (on Vercel the variables come from the environment).
try {
  process.loadEnvFile();
} catch {
  // No .env file — rely on the process environment.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
