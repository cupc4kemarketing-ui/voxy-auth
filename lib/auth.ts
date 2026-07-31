import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { License, Profile } from "@/types/database";

export interface SessionContext {
  userId: string;
  profile: Profile;
  isAdmin: boolean;
  activeLicense: License | null;
}

/**
 * Resolves the current request's authenticated user, profile, admin status,
 * and active license — all re-verified server-side against Supabase.
 * Returns null when there is no authenticated session.
 */
export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: admin }, { data: licenses }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("licenses")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
  ]);

  if (!profile) return null;

  const licenseRows = (licenses ?? []) as License[];
  const now = Date.now();
  const activeLicense =
    licenseRows.find((l) => !l.expires_at || new Date(l.expires_at).getTime() > now) ?? null;

  return {
    userId: user.id,
    profile,
    isAdmin: Boolean(admin),
    activeLicense,
  };
}

export async function requireAdmin(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx || !ctx.isAdmin) {
    throw new Error("FORBIDDEN");
  }
  return ctx;
}
