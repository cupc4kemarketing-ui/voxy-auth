import Link from "next/link";
import { Download, KeyRound, LogOut, Calendar, Hash, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MotionCard } from "@/components/dashboard/motion-card";
import { getSessionContext } from "@/lib/auth";
import { signOutAction } from "@/lib/actions/auth";
import { DURATION_LABELS, daysRemaining } from "@/lib/licenses";

export default async function DashboardPage() {
  const ctx = await getSessionContext();
  if (!ctx) return null;

  const { profile, activeLicense, isAdmin } = ctx;
  const initials = profile.username.slice(0, 2).toUpperCase();
  const remaining = activeLicense ? daysRemaining(activeLicense.expires_at) : null;
  const isLifetime = activeLicense ? activeLicense.expires_at === null : false;

  return (
    <div className="flex flex-col gap-6">
      <MotionCard className="overflow-hidden p-0">
        <div className="relative flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent/15 blur-[100px]" />
          <div className="relative flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-4 ring-white/[0.06]">
              <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.username} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{profile.username}</h1>
                {isAdmin && (
                  <Badge variant="default">
                    <ShieldCheck className="h-3 w-3" /> Admin
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Welcome back to your dashboard.</p>
            </div>
          </div>

          <div className="relative flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/dashboard/download">
                <Download className="h-4 w-4" /> Download Client
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/dashboard/redeem">
                <KeyRound className="h-4 w-4" /> Redeem Key
              </Link>
            </Button>
            <form action={signOutAction}>
              <Button type="submit" variant="outline">
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </form>
          </div>
        </div>
      </MotionCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <MotionCard delay={0.05} className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Subscription</h2>
            {activeLicense ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="danger">No Subscription</Badge>
            )}
          </div>

          {activeLicense ? (
            <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Plan</p>
                <p className="mt-1 text-lg font-semibold">{DURATION_LABELS[activeLicense.duration]}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Days Remaining</p>
                <p className="mt-1 text-lg font-semibold">{isLifetime ? "∞" : `${remaining} days`}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expires</p>
                <p className="mt-1 text-lg font-semibold">
                  {isLifetime
                    ? "Never"
                    : new Date(activeLicense.expires_at!).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-start gap-3 rounded-[14px] border border-dashed border-white/10 p-6">
              <p className="text-sm text-muted-foreground">
                You don&apos;t have an active subscription yet. Redeem a license key to unlock
                downloads.
              </p>
              <Button asChild size="sm">
                <Link href="/dashboard/redeem">
                  <KeyRound className="h-4 w-4" /> Redeem a Key
                </Link>
              </Button>
            </div>
          )}
        </MotionCard>

        <MotionCard delay={0.1}>
          <h2 className="text-base font-semibold">Account</h2>
          <div className="mt-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/5 text-muted-foreground">
                <Hash className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Discord ID</p>
                <p className="font-mono text-sm">{profile.discord_id}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/5 text-muted-foreground">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Account Created</p>
                <p className="text-sm">
                  {new Date(profile.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/5 text-muted-foreground">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm">{activeLicense ? "Entitled" : "Free"}</p>
              </div>
            </div>
          </div>
        </MotionCard>
      </div>
    </div>
  );
}
