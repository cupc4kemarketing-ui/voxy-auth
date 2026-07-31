import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeExpiresAt } from "@/lib/licenses";

const KEY_PATTERN = /^VOXY-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const rawKey = (body as { key?: unknown }).key;
  if (typeof rawKey !== "string") {
    return NextResponse.json({ error: "A license key is required." }, { status: 400 });
  }

  const key = rawKey.trim().toUpperCase();
  if (!KEY_PATTERN.test(key)) {
    return NextResponse.json({ error: "That doesn't look like a valid Voxy key." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Atomically claim the key: only succeeds if it is still unused.
  const { data: claimedKey, error: claimError } = await admin
    .from("license_keys")
    .update({ status: "redeemed", redeemed_by: user.id, redeemed_at: new Date().toISOString() })
    .eq("key", key)
    .eq("status", "unused")
    .select("*")
    .maybeSingle();

  if (claimError) {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  if (!claimedKey) {
    // Distinguish "does not exist" from "already used" for a clearer message,
    // without letting either path re-claim the key.
    const { data: existing } = await admin
      .from("license_keys")
      .select("status")
      .eq("key", key)
      .maybeSingle();

    const message =
      existing?.status === "redeemed"
        ? "This key has already been redeemed."
        : existing?.status === "disabled"
          ? "This key has been disabled."
          : "Invalid license key.";

    return NextResponse.json({ error: message }, { status: 400 });
  }

  const startedAt = new Date();
  const expiresAt = computeExpiresAt(claimedKey.duration, startedAt);

  const { data: license, error: licenseError } = await admin
    .from("licenses")
    .insert({
      user_id: user.id,
      license_key_id: claimedKey.id,
      duration: claimedKey.duration,
      status: "active",
      started_at: startedAt.toISOString(),
      expires_at: expiresAt ? expiresAt.toISOString() : null,
    })
    .select("*")
    .single();

  if (licenseError || !license) {
    // Roll back the key claim so it isn't lost if license creation failed.
    await admin
      .from("license_keys")
      .update({ status: "unused", redeemed_by: null, redeemed_at: null })
      .eq("id", claimedKey.id);

    return NextResponse.json({ error: "Failed to activate your license. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true, license });
}
