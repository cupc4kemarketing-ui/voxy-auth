"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Search, Ban, Fingerprint } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { DURATION_LABELS, daysRemaining } from "@/lib/licenses";
import type { AdminUser } from "@/types/admin";
import type { License } from "@/types/database";

export function UsersPanel({ initialUsers }: { initialUsers: AdminUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [pendingLicenseId, setPendingLicenseId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      startTransition(async () => {
        try {
          const res = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`, {
            signal: controller.signal,
          });
          const data = await res.json();
          if (res.ok) setUsers(data.users);
        } catch {
          // aborted or network error — ignore
        }
      });
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  async function handleResetHwid(userId: string, license: License) {
    setPendingLicenseId(license.id);
    try {
      const res = await fetch(`/api/admin/licenses/${license.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_hwid" }),
      });
      if (!res.ok) throw new Error();
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                licenses: u.licenses.map((l) =>
                  l.id === license.id ? { ...l, hwid: null, hwid_locked_at: null } : l,
                ),
              }
            : u,
        ),
      );
      toast.success("HWID reset — the user can activate on new hardware.");
    } catch {
      toast.error("Failed to reset HWID.");
    } finally {
      setPendingLicenseId(null);
    }
  }

  async function handleRevoke(userId: string, license: License) {
    setPendingLicenseId(license.id);
    try {
      const res = await fetch(`/api/admin/licenses/${license.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke" }),
      });
      if (!res.ok) throw new Error();
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, licenses: u.licenses.filter((l) => l.id !== license.id) } : u,
        ),
      );
      toast.success("License revoked — the client kill-switches on its next check.");
    } catch {
      toast.error("Failed to revoke license.");
    } finally {
      setPendingLicenseId(null);
    }
  }

  return (
    <Card className="p-6">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search username or Discord ID..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="mt-6 flex flex-col divide-y divide-white/[0.06]">
        {isPending && users.length === 0 && (
          <div className="flex flex-col gap-3 py-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        )}

        {users.map((user) => {
          const activeLicense = user.licenses.find((l) => !l.expires_at || new Date(l.expires_at) > new Date());
          const remaining = activeLicense ? daysRemaining(activeLicense.expires_at) : null;
          const initials = user.username.slice(0, 2).toUpperCase();
          const busy = activeLicense ? pendingLicenseId === activeLicense.id : false;

          return (
            <div key={user.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url ?? undefined} alt={user.username} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user.username}</p>
                  <p className="font-mono text-xs text-muted-foreground">{user.discord_id}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {activeLicense ? (
                  <>
                    <div className="text-right">
                      <Badge variant="success">{DURATION_LABELS[activeLicense.duration]}</Badge>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {activeLicense.expires_at ? `${remaining}d left` : "Lifetime"}
                        {" · "}
                        {activeLicense.hwid ? (
                          <span className="inline-flex items-center gap-1 text-foreground/70">
                            <Fingerprint className="h-3 w-3" /> HWID locked
                          </span>
                        ) : (
                          "No HWID yet"
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy || !activeLicense.hwid}
                        onClick={() => handleResetHwid(user.id, activeLicense)}
                        title={activeLicense.hwid ? "Reset HWID lock" : "No HWID lock set yet"}
                      >
                        <Fingerprint className="h-3.5 w-3.5" /> Reset HWID
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={busy}
                        onClick={() => handleRevoke(user.id, activeLicense)}
                        title="Revoke this license"
                      >
                        <Ban className="h-3.5 w-3.5" /> Revoke
                      </Button>
                    </div>
                  </>
                ) : (
                  <Badge variant="muted">No subscription</Badge>
                )}
              </div>
            </div>
          );
        })}

        {!isPending && users.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No users found.</p>
        )}
      </div>
    </Card>
  );
}
