import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Admin actions on a single license row, keyed by `action` in the body:
//   - "revoke"     : set status = 'revoked'. /api/license/validate already refuses any license
//                    whose status isn't 'active', so the player's client kill-switches within a
//                    recheck cycle (see LicenseGate's periodic recheck) — this is how you revoke a
//                    player's key.
//   - "reset_hwid" : clear the HWID lock so the user can run on new hardware. Their next launch
//                    re-pins the license to whatever machine validates first.
// Same auth posture as the keys route: re-verified admin session, service-role write.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSessionContext();
  if (!ctx || !ctx.isAdmin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const action = body?.action as "revoke" | "reset_hwid" | undefined;

  const admin = createAdminClient();

  if (action === "reset_hwid") {
    const { data, error } = await admin
      .from("licenses")
      .update({ hwid: null, hwid_locked_at: null })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json({ error: "Failed to reset HWID." }, { status: 500 });
    }
    return NextResponse.json({ license: data });
  }

  if (action === "revoke") {
    const { data, error } = await admin
      .from("licenses")
      .update({ status: "revoked" })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json({ error: "Failed to revoke license." }, { status: 500 });
    }
    return NextResponse.json({ license: data });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
