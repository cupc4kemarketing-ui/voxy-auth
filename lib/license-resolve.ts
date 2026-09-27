import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { isExpired } from "@/lib/licenses";

// Resolves the profiles.id behind a Cobalt client's embedded licenseId — the same active/expired
// check /api/license/validate already performs, pulled out here so every route that trusts a
// licenseId as "this request is really from license-holder X" (config publish/unpublish, and
// anything similar later) enforces it identically instead of re-implementing the check per route.
export async function resolveUserIdFromLicense(
  admin: SupabaseClient<Database>,
  licenseId: string | undefined | null
): Promise<string | null> {
  if (!licenseId) return null;
  const { data: license } = await admin.from("licenses").select("*").eq("id", licenseId).maybeSingle();
  if (!license) return null;
  if (license.status !== "active" || isExpired(license.expires_at)) return null;
  return license.user_id;
}
