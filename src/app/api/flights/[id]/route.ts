import { NextResponse } from "next/server";
import { jsonError, validationError } from "@/lib/api";
import { getFlightProvider } from "@/lib/flights";
import { dealIdSchema } from "@/lib/validation";

export async function GET(_request: Request, { params }: RouteContext<"/api/flights/[id]">) {
  const parsed = dealIdSchema.safeParse((await params).id);
  if (!parsed.success) return validationError(parsed.error);
  const deal = await getFlightProvider().getDeal(parsed.data);
  if (!deal) return jsonError(404, "Deal not found or no longer available");
  return NextResponse.json({ deal });
}
