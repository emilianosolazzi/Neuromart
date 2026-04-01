import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

export const hasDatabase = Boolean(process.env.DATABASE_URL);

export const pool = hasDatabase
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

export const db = pool
  ? drizzle(pool, { schema })
  : null;

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
  }
}