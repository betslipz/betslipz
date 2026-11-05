import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { sendPlanReminders } from "@/lib/reminders";

// Called once a day by the Netlify scheduled function in netlify/functions/plan-reminders.mts.
// Protected by CRON_SECRET so nobody else can trigger emails.
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const ok = !!secret && given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret));
  if (!ok) return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  return NextResponse.json(await sendPlanReminders());
}
