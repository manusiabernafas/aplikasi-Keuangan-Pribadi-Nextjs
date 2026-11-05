import { defineConfig } from "drizzle-kit";

// Hanya untuk `drizzle-kit generate`; migrasi dijalankan oleh scripts/db-migrate.mjs
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./db/drizzle",
  dialect: "postgresql",
});
