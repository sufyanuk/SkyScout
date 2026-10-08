"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { fieldErrors, profileSchema } from "@/lib/validation";
import { setHomeAirportCookie } from "@/lib/services/preferences";

export interface ProfileFormState {
  ok?: boolean;
  error?: string;
  fields?: Record<string, string>;
}

export async function updateProfileAction(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const user = await requireUser("/dashboard");
  const parsed = profileSchema.safeParse({ name: formData.get("name"), homeAirport: formData.get("homeAirport") });
  if (!parsed.success) return { fields: fieldErrors(parsed.error) };
  await db.user.update({ where: { id: user.id }, data: parsed.data });
  await setHomeAirportCookie(parsed.data.homeAirport);
  revalidatePath("/", "layout");
  return { ok: true };
}
