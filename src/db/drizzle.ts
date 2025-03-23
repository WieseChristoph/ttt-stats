import { drizzle } from "drizzle-orm/node-postgres";

const DATABASE_URL = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

export const db = drizzle(DATABASE_URL);
