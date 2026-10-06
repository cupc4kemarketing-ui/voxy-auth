import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isExpired } from "@/lib/licenses";

// Called directly by the Cobalt client (not a browser session) using the licenseId
// embedded in its jar at download time. Lets the server revoke access early —
// e.g. a refund or ban — even before a key's signed expiry date is reached.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const licenseId = body?.licenseId as string | undefined;
  // Hardware fingerprint the client computes locally (see LicenseGate.hwid()). Trimmed and
  // length-capped so a malformed/oversized value can't bloat the row; absence is tolerated
  // for backward compatibility with older clients (they simply never get HWID-locked).
  const hwid = typeof body?.hwid === "string" ? body.hwid.trim().slice(0, 128) : undefined;

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

  // HWID lock. The server is the enforcement point — the client only reports its fingerprint,
  // it cannot decide the verdict. First successful validation pins the license to that machine;
  // every later validation must present the same hwid or it's refused. Use the admin reset
  // (clear licenses.hwid for this row) to let a user legitimately move to new hardware.
  if (hwid) {
    if (!license.hwid) {
      // Lock on first launch. Guard the write on hwid still being null so two near-simultaneous
      // first launches on different machines can't both win the race — the second update matches
      // no row, we re-read, and it falls through to the mismatch branch below.
      const { data: locked } = await admin
        .from("licenses")
        .update({ hwid, hwid_locked_at: new Date().toISOString() })
        .eq("id", license.id)
        .is("hwid", null)
        .select("hwid")
        .maybeSingle();
      const pinned = locked?.hwid ?? license.hwid;
      if (pinned && pinned !== hwid) {
        return NextResponse.json({ valid: false, reason: "This license is locked to another device." });
      }
    } else if (license.hwid !== hwid) {
      return NextResponse.json({ valid: false, reason: "This license is locked to another device." });
    }
  }

  // Surfaced so the client can show/hide admin-only UI (e.g. publishing to the Public Configs
  // list) — this is a UX convenience only, NOT the enforcement point. /api/config/publish
  // independently re-checks admin membership server-side before actually accepting a publish, so
  // a modified client claiming isAdmin can't actually publish anything.
  const { data: adminRow } = await admin.from("admins").select("user_id").eq("user_id", license.user_id).maybeSingle();

  return NextResponse.json({ valid: true, expiresAt: license.expires_at, isAdmin: !!adminRow });
}
