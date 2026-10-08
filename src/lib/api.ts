import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { fieldErrors } from "@/lib/validation";

export function jsonError(status: number, error: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status });
}

export function validationError(error: z.ZodError) {
  return jsonError(400, "Invalid request", { fields: fieldErrors(error) });
}

/** Resolve the signed-in user for an API route, or a 401 response. */
export async function requireApiUser() {
  const user = await getCurrentUser();
  if (!user) return { user: null, response: jsonError(401, "Authentication required") } as const;
  return { user, response: null } as const;
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
