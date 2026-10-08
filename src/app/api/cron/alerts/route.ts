import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { checkDueAlerts } from "@/lib/services/alerts";

/**
 * Scheduled alert checker. Point a cron (Vercel Cron, GitHub Actions, etc.) at
 * GET /api/cron/alerts with "Authorization: Bearer $CRON_SECRET".
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return jsonError(503, "CRON_SECRET is not configured");
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return jsonError(401, "Unauthorized");
  const checked = await checkDueAlerts();
  return NextResponse.json({ ok: true, checked });
}
