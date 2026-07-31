import { NextResponse } from "next/server";
import AdmZip from "adm-zip";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isExpired } from "@/lib/licenses";
import { signLicensePayload } from "@/lib/license-signing";

export const runtime = "nodejs";

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
  const filename = `${safeUsername}-cobalt.${release.version}.jar`;

  const { data: jarBlob, error: downloadError } = await admin.storage
    .from("Cobalt Client")
    .download(release.file_path);

  if (downloadError || !jarBlob) {
    console.error("Failed to download release from storage:", downloadError);
    return NextResponse.json({ error: "Failed to load the release build." }, { status: 500 });
  }

  // Stamp a signed, per-user license file into the jar so the client can verify its own
  // entitlement (including expiry) without needing the user to enter a key manually.
  const signedLicense = signLicensePayload({
    licenseId: activeLicense.id,
    username: safeUsername,
    expiresAt: activeLicense.expires_at,
    issuedAt: new Date().toISOString(),
  });

  const jarBuffer = Buffer.from(await jarBlob.arrayBuffer());
  const zip = new AdmZip(jarBuffer);
  zip.addFile("cobalt-license.json", Buffer.from(JSON.stringify(signedLicense)));
  const stampedJar = zip.toBuffer();

  await admin.from("downloads").insert({
    user_id: user.id,
    version: release.version,
    filename,
  });

  return new NextResponse(new Uint8Array(stampedJar), {
    headers: {
      "Content-Type": "application/java-archive",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(stampedJar.length),
    },
  });
}
