import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateLicenseKey } from "@/lib/licenses";
import type { LicenseDuration } from "@/types/database";

const VALID_DURATIONS: LicenseDuration[] = ["14_days", "30_days", "lifetime"];

export async function POST(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx || !ctx.isAdmin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const duration = body?.duration as LicenseDuration | undefined;
  const count = Math.min(Math.max(Number(body?.count) || 1, 1), 100);

  if (!duration || !VALID_DURATIONS.includes(duration)) {
    return NextResponse.json({ error: "Invalid duration." }, { status: 400 });
  }

  const admin = createAdminClient();

  const rows = Array.from({ length: count }, () => ({
    key: generateLicenseKey(),
    duration,
    status: "unused" as const,
    created_by: ctx.userId,
  }));

  const { data, error } = await admin.from("license_keys").insert(rows).select("*");

  if (error) {
    return NextResponse.json({ error: "Failed to generate keys." }, { status: 500 });
  }

  return NextResponse.json({ keys: data });
}

export async function GET(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx || !ctx.isAdmin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("license_keys")
    .select("*, redeemed_profile:profiles!license_keys_redeemed_by_fkey(username, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: "Failed to load keys." }, { status: 500 });
  }

  return NextResponse.json({ keys: data });
}
