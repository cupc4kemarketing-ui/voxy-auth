import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveUserIdFromLicense } from "@/lib/license-resolve";
import { generateShareCode } from "@/lib/share-code";

// Collisions are astronomically rare at 32^5 possible codes, but a unique-constraint retry costs
// nothing and turns "astronomically rare" into "never observably fails".
const SHARE_CODE_MAX_ATTEMPTS = 5;

// Cap on how many configs a single license holder can have published at once — the client's own
// "Public Configs" tab lists whatever's here, so this bounds it from becoming an unmoderated dump
// rather than a curated browse list. Independent of ConfigManager.MAX_SAVED_CONFIGS on the client
// (that's local save SLOTS; this is published/shared configs).
const MAX_PUBLISHED_PER_USER = 5;
const MAX_NAME_LEN = 40;
// Generous ceiling for a gzip+base64 config blob — real configs are a few hundred bytes to a few
// KB even unminimized; this just bounds worst-case abuse, not anything a real client ever sends.
const MAX_CODE_LEN = 200_000;

// Called directly by the Cobalt client (not a browser session) with the same licenseId embedded
// in its jar that /api/license/validate already checks — see resolveUserIdFromLicense.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const licenseId = body?.licenseId as string | undefined;
  const name = (body?.name as string | undefined)?.trim();
  const code = body?.code as string | undefined;

  if (!name || !code) {
    return NextResponse.json({ ok: false, reason: "Missing name or code." }, { status: 400 });
  }
  if (name.length > MAX_NAME_LEN) {
    return NextResponse.json({ ok: false, reason: `Name must be ${MAX_NAME_LEN} characters or fewer.` }, { status: 400 });
  }
  if (code.length > MAX_CODE_LEN) {
    return NextResponse.json({ ok: false, reason: "Config code is too large to publish." }, { status: 400 });
  }

  const admin = createAdminClient();
  const userId = await resolveUserIdFromLicense(admin, licenseId);
  if (!userId) {
    return NextResponse.json({ ok: false, reason: "Invalid or inactive license." }, { status: 401 });
  }

  // Publishing to the Public Configs list is admin-only, by request — this is the actual
  // enforcement point (the client's isAdmin flag from /api/license/validate only controls whether
  // the UI shows the option; a modified/rebuilt client claiming isAdmin still hits this check).
  const { data: adminRow } = await admin.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (!adminRow) {
    return NextResponse.json({ ok: false, reason: "Only admins can publish configs." }, { status: 403 });
  }

  const { count } = await admin
    .from("shared_configs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if ((count ?? 0) >= MAX_PUBLISHED_PER_USER) {
    return NextResponse.json(
      { ok: false, reason: `You can publish at most ${MAX_PUBLISHED_PER_USER} configs — unpublish one first.` },
      { status: 409 }
    );
  }

  for (let attempt = 0; attempt < SHARE_CODE_MAX_ATTEMPTS; attempt++) {
    const shareCode = generateShareCode();
    const { data, error } = await admin
      .from("shared_configs")
      .insert({ user_id: userId, name, code, share_code: shareCode })
      .select("id, share_code")
      .single();

    if (!error && data) {
      return NextResponse.json({ ok: true, id: data.id, shareCode: data.share_code });
    }
    // 23505 = unique_violation — only retry on that (a share_code collision); anything else
    // (bad connection, RLS misconfig, etc.) isn't going to be fixed by trying a different code.
    if (error && error.code !== "23505") {
      return NextResponse.json({ ok: false, reason: "Failed to publish." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: false, reason: "Failed to generate a unique share code — try again." }, { status: 500 });
}
