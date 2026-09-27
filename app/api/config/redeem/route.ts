import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Redeeming by share code needs no license at all — the code itself already IS the "you have
// permission to read this one config" token, same trust level as being handed the full pasted
// blob directly. This is what lets a 5-character code stand in for that blob in the Import Config
// flow instead of a giant paste.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code")?.trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ ok: false, reason: "Missing code." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("shared_configs")
    .select("name, code")
    .eq("share_code", code)
    .maybeSingle();
  if (data) {
    return NextResponse.json({ ok: true, name: data.name, code: data.code });
  }

  // Not a published config — a private code from someone's My Configs (see /api/config/share).
  const { data: priv } = await admin
    .from("config_codes")
    .select("name, code")
    .eq("share_code", code)
    .maybeSingle();
  if (priv) {
    return NextResponse.json({ ok: true, name: priv.name, code: priv.code });
  }

  return NextResponse.json({ ok: false, reason: "Unknown code." }, { status: 404 });
}
