import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError, readJson, requireApiUser, validationError } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { createAlert, listAlerts } from "@/lib/services/alerts";
import { alertSchema } from "@/lib/validation";

const MAX_ACTIVE_ALERTS = 25;

/** GET /api/alerts — the signed-in user's alerts (including history events). */
export async function GET() {
  const { user, response } = await requireApiUser();
  if (!user) return response;
  const alerts = await listAlerts(user.id);
  return NextResponse.json({ alerts: alerts.filter((a) => a.status !== "DELETED") });
}

/** POST /api/alerts — create a price alert. */
export async function POST(request: Request) {
  const { user, response } = await requireApiUser();
  if (!user) return response;
  if (!rateLimit(`alerts:${user.id}`, 30, 60 * 60 * 1000).ok) return jsonError(429, "Too many alerts created. Try again later.");

  const parsed = alertSchema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  const count = await db.priceAlert.count({ where: { userId: user.id, status: { in: ["ACTIVE", "PAUSED", "TRIGGERED"] } } });
  if (count >= MAX_ACTIVE_ALERTS) return jsonError(422, `You can have up to ${MAX_ACTIVE_ALERTS} alerts. Delete one to add another.`);

  const alert = await createAlert(user.id, parsed.data);
  return NextResponse.json({ alert }, { status: 201 });
}
