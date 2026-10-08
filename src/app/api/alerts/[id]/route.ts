import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireApiUser, validationError } from "@/lib/api";
import { deleteAlert } from "@/lib/services/alerts";

/** DELETE /api/alerts/:id — soft-deletes so it stays in alert history. */
export async function DELETE(_request: Request, { params }: RouteContext<"/api/alerts/[id]">) {
  const { user, response } = await requireApiUser();
  if (!user) return response;
  const id = z.string().min(1).max(40).safeParse((await params).id);
  if (!id.success) return validationError(id.error);
  const deleted = await deleteAlert(user.id, id.data);
  if (!deleted) return jsonError(404, "Alert not found");
  return NextResponse.json({ ok: true });
}
