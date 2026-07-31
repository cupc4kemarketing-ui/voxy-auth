import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx || !ctx.isAdmin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  const admin = createAdminClient();
  let profilesQuery = admin.from("profiles").select("*").order("created_at", { ascending: false }).limit(25);

  if (query) {
    profilesQuery = profilesQuery.or(`username.ilike.%${query}%,discord_id.ilike.%${query}%`);
  }

  const { data: profiles, error } = await profilesQuery;

  if (error) {
    return NextResponse.json({ error: "Failed to search users." }, { status: 500 });
  }

  const userIds = (profiles ?? []).map((p) => p.id);
  const { data: licenses } = userIds.length
    ? await admin.from("licenses").select("*").in("user_id", userIds).eq("status", "active")
    : { data: [] };

  const users = (profiles ?? []).map((profile) => ({
    ...profile,
    licenses: (licenses ?? []).filter((l) => l.user_id === profile.id),
  }));

  return NextResponse.json({ users });
}
