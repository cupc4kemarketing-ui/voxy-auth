import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveUserIdFromLicense } from "@/lib/license-resolve";
import { generateShareCode, PRIVATE_CODE_LENGTH } from "@/lib/share-code";

const SHARE_CODE_MAX_ATTEMPTS = 5;
const MAX_NAME_LEN = 40;
const MAX_CODE_LEN = 200_000;
// Oldest codes beyond this are deleted, so one account can't grow the table without bound.
const MAX_CODES_PER_USER = 100;

// Gives a license holder a private 6-character code for one of their own configs (the copy button
// on a My Configs card in the Cobalt client). Never listed anywhere — whoever has the code can
// redeem it via /api/config/redeem, nothing else. Copying the exact same config again returns the
// same code instead of minting a new one.
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
    return NextResponse.json({ ok: false, reason: "Config code is too large." }, { status: 400 });
  }

  const admin = createAdminClient();
  const userId = await resolveUserIdFromLicense(admin, licenseId);
  if (!userId) {
    return NextResponse.json({ ok: false, reason: "Invalid or inactive license." }, { status: 401 });
  }

  const codeHash = createHash("sha256").update(code).digest("hex");
  const { data: existing } = await admin
    .from("config_codes")
    .select("share_code")
    .eq("user_id", userId)
    .eq("code_hash", codeHash)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ ok: true, shareCode: existing.share_code });
  }

  for (let attempt = 0; attempt < SHARE_CODE_MAX_ATTEMPTS; attempt++) {
    const shareCode = generateShareCode(PRIVATE_CODE_LENGTH);
    const { data, error } = await admin
      .from("config_codes")
      .insert({ user_id: userId, name, code, code_hash: codeHash, share_code: shareCode })
      .select("share_code")
      .single();

    if (!error && data) {
      await trimOldCodes(admin, userId);
      return NextResponse.json({ ok: true, shareCode: data.share_code });
    }
    // 23505 = unique_violation: a share_code collision (retry with a new code) — or this user just
    // stored the same config concurrently, in which case the existing row answers it.
    if (error && error.code !== "23505") {
      return NextResponse.json({ ok: false, reason: "Failed to create a code." }, { status: 500 });
    }
    const { data: raced } = await admin
      .from("config_codes")
      .select("share_code")
      .eq("user_id", userId)
      .eq("code_hash", codeHash)
      .maybeSingle();
    if (raced) {
      return NextResponse.json({ ok: true, shareCode: raced.share_code });
    }
  }

  return NextResponse.json({ ok: false, reason: "Failed to generate a unique code — try again." }, { status: 500 });
}

async function trimOldCodes(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data: stale } = await admin
    .from("config_codes")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(MAX_CODES_PER_USER, MAX_CODES_PER_USER + 99);
  if (stale && stale.length > 0) {
    await admin.from("config_codes").delete().in("id", stale.map((row) => row.id));
  }
}
