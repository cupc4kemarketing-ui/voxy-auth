import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SharedConfigWithAuthor } from "@/types/admin";

const LIST_LIMIT = 100;

// Lists every published config in the Public Configs catalog, for the admin dashboard's Configs
// tab — admin-only, unlike the client-facing /api/config/public which is a public browse list.
export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx || !ctx.isAdmin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("shared_configs")
    .select("*, profiles(username)")
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (error) {
    return NextResponse.json({ error: "Failed to load configs." }, { status: 500 });
  }

  const configs: SharedConfigWithAuthor[] = (data ?? []).map((row) => {
    const r = row as unknown as {
      id: string;
      user_id: string;
      name: string;
      code: string;
      share_code: string;
      created_at: string;
      profiles: { username: string } | null;
    };
    return {
      id: r.id,
      user_id: r.user_id,
      name: r.name,
      code: r.code,
      share_code: r.share_code,
      created_at: r.created_at,
      author: r.profiles?.username ?? "Unknown",
    };
  });

  return NextResponse.json({ configs });
}
