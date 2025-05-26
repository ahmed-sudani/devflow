import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import "dotenv/config";
import { Database } from "@/db/schema";
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
export const db = drizzle<Database>(pool);
