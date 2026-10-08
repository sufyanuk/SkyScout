"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { evaluateAlert, setAlertPaused } from "@/lib/services/alerts";

export async function toggleAlertPaused(alertId: string, paused: boolean) {
  const user = await requireUser("/alerts");
  const result = await setAlertPaused(user.id, alertId, paused);
  revalidatePath("/alerts");
  return { ok: !!result, status: result?.status ?? null };
}

export async function checkAlertNow(alertId: string) {
  const user = await requireUser("/alerts");
  const alert = await db.priceAlert.findFirst({ where: { id: alertId, userId: user.id, status: { not: "DELETED" } } });
  if (!alert) return { ok: false as const, error: "Alert not found" };
  const updated = await evaluateAlert(alert, user.email ?? null);
  revalidatePath("/alerts");
  return { ok: true as const, status: updated.status, price: updated.lastSeenPrice };
}
