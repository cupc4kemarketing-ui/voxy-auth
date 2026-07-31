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

  return NextResponse.json({ valid: true, expiresAt: license.expires_at });
}
