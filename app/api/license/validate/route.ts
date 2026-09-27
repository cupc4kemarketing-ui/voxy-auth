import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isExpired } from "@/lib/licenses";

// Called directly by the Cobalt client (not a browser session) using the licenseId
// embedded in its jar at download time. Lets the server revoke access early —
// e.g. a refund or ban — even before a key's signed expiry date is reached.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const licenseId = body?.licenseId as string | undefined;

  if (!licenseId) {
    return NextResponse.json({ valid: false, reason: "Missing licenseId." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: license } = await admin.from("licenses").select("*").eq("id", licenseId).maybeSingle();

  if (!license) {
    return NextResponse.json({ valid: false, reason: "License not found." }, { status: 404 });
  }

  if (license.status !== "active" || isExpired(license.expires_at)) {
    return NextResponse.json({ valid: false, reason: "License is no longer active." });
  }

  // Surfaced so the client can show/hide admin-only UI (e.g. publishing to the Public Configs
  // list) — this is a UX convenience only, NOT the enforcement point. /api/config/publish
  // independently re-checks admin membership server-side before actually accepting a publish, so
  // a modified client claiming isAdmin can't actually publish anything.
  const { data: adminRow } = await admin.from("admins").select("user_id").eq("user_id", license.user_id).maybeSingle();

  return NextResponse.json({ valid: true, expiresAt: license.expires_at, isAdmin: !!adminRow });
}
