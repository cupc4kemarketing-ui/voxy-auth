import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const LIST_LIMIT = 50;

// Publicly browsable — no licenseId required to READ this list (only to publish/unpublish, see
// the sibling routes), same as any other "browse public X" catalog. Still only ever touched via
// the service-role client server-side; the anon key never gets its own RLS-backed read path here.
export async function GET() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("shared_configs")
    .select("id, name, code, share_code, created_at, profiles(username)")
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (error) {
    return NextResponse.json({ ok: false, reason: "Failed to load public configs." }, { status: 500 });
  }

  const configs = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code,
    shareCode: row.share_code,
    createdAt: row.created_at,
    author: (row.profiles as unknown as { username: string } | null)?.username ?? "Unknown",
  }));

  return NextResponse.json({ ok: true, configs });
}
