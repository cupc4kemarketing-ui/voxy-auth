import { Download, Tag, CalendarClock, FileText, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MotionCard } from "@/components/dashboard/motion-card";
import { getSessionContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isExpired } from "@/lib/licenses";
import Link from "next/link";

export default async function DownloadPage() {
  const ctx = await getSessionContext();
  if (!ctx) return null;

  const { profile, activeLicense } = ctx;
  const entitled = Boolean(activeLicense) && !isExpired(activeLicense?.expires_at ?? null);

  const admin = createAdminClient();
  const [{ data: release }, { data: history }] = await Promise.all([
    admin.from("releases").select("*").eq("is_latest", true).maybeSingle(),
    admin
      .from("downloads")
      .select("*")
      .eq("user_id", profile.id)
      .order("downloaded_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Download</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Grab the latest build of Voxy, tailored to your account.
        </p>
      </div>

      {!entitled ? (
        <MotionCard className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-danger/15 text-danger">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">No active subscription</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              You need an active license to download Voxy. Redeem a key to unlock instant access.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/redeem">Redeem a Key</Link>
          </Button>
        </MotionCard>
      ) : (
        <MotionCard className="overflow-hidden p-0">
          <div className="relative flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/15 blur-[100px]" />
            <div className="relative">
              <Badge variant="success">Latest Release</Badge>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">
                {release ? `v${release.version}` : "No release yet"}
              </h2>
              {release && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Released{" "}
                  {new Date(release.released_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
            <Button asChild size="lg" className="relative" disabled={!release}>
              <a href="/api/download">
                <Download className="h-[18px] w-[18px]" /> Download Latest Version
              </a>
            </Button>
          </div>

          {release?.changelog && (
            <div className="border-t border-white/[0.06] p-8 pt-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <FileText className="h-4 w-4" /> Changelog
              </h3>
              <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
                {release.changelog}
              </pre>
            </div>
          )}
        </MotionCard>
      )}

      <MotionCard delay={0.1}>
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Tag className="h-4 w-4" /> Download History
        </h2>
        {history && history.length > 0 ? (
          <div className="mt-4 flex flex-col divide-y divide-white/[0.06]">
            {history.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-mono text-sm">{d.filename}</p>
                  <p className="text-xs text-muted-foreground">Version {d.version}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(d.downloaded_at).toLocaleString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">You haven&apos;t downloaded Voxy yet.</p>
        )}
      </MotionCard>
    </div>
  );
}
