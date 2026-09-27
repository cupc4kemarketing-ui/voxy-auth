import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveUserIdFromLicense } from "@/lib/license-resolve";

// Called directly by the Cobalt client with the same licenseId /api/license/validate checks.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const licenseId = body?.licenseId as string | undefined;
  const id = body?.id as string | undefined;

  if (!id) {
    return NextResponse.json({ ok: false, reason: "Missing id." }, { status: 400 });
  }

  const admin = createAdminClient();
  const userId = await resolveUserIdFromLicense(admin, licenseId);
  if (!userId) {
    return NextResponse.json({ ok: false, reason: "Invalid or inactive license." }, { status: 401 });
  }

  // Ownership check is the WHERE clause itself, not a separate read-then-check — a delete that
  // matches zero rows (wrong owner, or already gone) and a delete that matches one row both
  // return success from Supabase's perspective, so this can't be used to probe which config ids
  // exist versus which ones a caller happens to own.
  const { error } = await admin.from("shared_configs").delete().eq("id", id).eq("user_id", userId);
  if (error) {
    return NextResponse.json({ ok: false, reason: "Failed to unpublish." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
