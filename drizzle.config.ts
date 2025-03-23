import { defineConfig } from "drizzle-kit";

const DATABASE_URL = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema",
  out: "./migrations",
  dbCredentials: {
    url: DATABASE_URL,
  },
});