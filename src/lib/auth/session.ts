import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** The signed-in user (id, name, email) or null. Deduplicated per request. */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  return session?.user?.id ? session.user : null;
});

/** Authoritative gate for protected pages. */
export async function requireUser(callbackUrl: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  return user;
}
