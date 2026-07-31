import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isExpired } from "@/lib/licenses";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const admin = createAdminClient();

  // Re-verify entitlement server-side — never trust any client-supplied state.
  const { data: licenses } = await admin
    .from("licenses")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active");

  const activeLicense = (licenses ?? []).find((l) => !isExpired(l.expires_at));

  if (!activeLicense) {
    return NextResponse.json({ error: "No active subscription." }, { status: 403 });
  }

  const { data: release } = await admin
    .from("releases")
    .select("*")
    .eq("is_latest", true)
    .maybeSingle();

  if (!release) {
    return NextResponse.json({ error: "No release is currently available." }, { status: 404 });
  }

  const { data: profile } = await admin.from("profiles").select("username").eq("id", user.id).single();
  const safeUsername = (profile?.username ?? "Voxy").replace(/[^a-zA-Z0-9_-]/g, "");
  const filename = `${safeUsername}-Voxy.jar`;

  const { data: signed, error: signedError } = await admin.storage
    .from("client-builds")
    .createSignedUrl(release.file_path, 60, { download: filename });

  if (signedError || !signed) {
    return NextResponse.json({ error: "Failed to generate download link." }, { status: 500 });
  }

  await admin.from("downloads").insert({
    user_id: user.id,
    version: release.version,
    filename,
  });

  return NextResponse.redirect(signed.signedUrl);
}
