import { NextResponse } from "next/server";
import { jsonError, readJson, requireApiUser, validationError } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { addFavorite, DealNotFoundError, listFavorites } from "@/lib/services/favorites";
import { favoriteSchema } from "@/lib/validation";

/** GET /api/favorites — saved deals with live prices. */
export async function GET() {
  const { user, response } = await requireApiUser();
  if (!user) return response;
  return NextResponse.json({ favorites: await listFavorites(user.id) });
}

/** POST /api/favorites { dealId } — save a deal. */
export async function POST(request: Request) {
  const { user, response } = await requireApiUser();
  if (!user) return response;
  if (!rateLimit(`fav:${user.id}`, 120, 60 * 60 * 1000).ok) return jsonError(429, "Slow down — too many changes.");

  const parsed = favoriteSchema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);
  try {
    const favorite = await addFavorite(user.id, parsed.data.dealId);
    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error) {
    if (error instanceof DealNotFoundError) return jsonError(404, error.message);
    throw error;
  }
}
