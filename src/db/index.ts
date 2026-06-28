import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { instrumentClient } from "./logger";

// instrumentClient bọc client để log SQL (dev: mọi query; prod: chậm/lỗi).
const client = instrumentClient(postgres(process.env.DATABASE_URL!));

export const db = drizzle(client, { schema });
