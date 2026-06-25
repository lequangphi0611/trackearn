import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function ownerExists(): Promise<boolean> {
  const row = await db.query.user.findFirst({ where: eq(user.role, "owner") });
  return Boolean(row);
}
