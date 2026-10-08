import { NextResponse } from "next/server";
import { jsonError, requireApiUser, validationError } from "@/lib/api";
import { removeFavorite } from "@/lib/services/favorites";
import { dealIdSchema } from "@/lib/validation";

/** DELETE /api/favorites/:dealId — un-save a deal. */
export async function DELETE(_request: Request, { params }: RouteContext<"/api/favorites/[id]">) {
  const { user, response } = await requireApiUser();
  if (!user) return response;
  const parsed = dealIdSchema.safeParse(decodeURIComponent((await params).id));
  if (!parsed.success) return validationError(parsed.error);
  const removed = await removeFavorite(user.id, parsed.data);
  if (!removed) return jsonError(404, "This deal isn't in your saved flights");
  return NextResponse.json({ ok: true });
}
