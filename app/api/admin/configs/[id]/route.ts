import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_NAME_LEN = 40;

// Rename a published config. Admin-only; the client-facing publish/unpublish routes key ownership
// off a licenseId instead, but here the dashboard admin can rename any config in the catalog.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSessionContext();
  if (!ctx || !ctx.isAdmin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const name = (body?.name as string | undefined)?.trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (name.length > MAX_NAME_LEN) {
    return NextResponse.json({ error: `Name must be ${MAX_NAME_LEN} characters or fewer.` }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("shared_configs")
    .update({ name })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Failed to rename config." }, { status: 500 });
  }

  return NextResponse.json({ config: data });
}

// Remove a published config from the catalog.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSessionContext();
  if (!ctx || !ctx.isAdmin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("shared_configs").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete config." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
