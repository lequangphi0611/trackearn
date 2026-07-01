import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

// Healthcheck công khai (dưới /api nên proxy bỏ qua) — Docker dùng để biết
// container còn sống + ping DB. force-dynamic: không cache, luôn ping thật.
export const dynamic = "force-dynamic";

export async function GET() {
  let dbUp = false;
  try {
    await db.execute(sql`select 1`);
    dbUp = true;
  } catch {
    dbUp = false;
  }

  const body = {
    status: dbUp ? "ok" : "degraded",
    db: dbUp ? "up" : "down",
    version: process.env.GIT_SHA ?? "unknown",
    time: new Date().toISOString(),
  };
  return NextResponse.json(body, { status: dbUp ? 200 : 503 });
}
