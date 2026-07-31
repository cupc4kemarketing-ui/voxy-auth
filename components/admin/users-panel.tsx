"use client";

import { useEffect, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { DURATION_LABELS, daysRemaining } from "@/lib/licenses";
import type { AdminUser } from "@/types/admin";

export function UsersPanel({ initialUsers }: { initialUsers: AdminUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

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

          return (
            <div key={user.id} className="flex items-center justify-between gap-4 py-4">
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

              <div className="flex items-center gap-4 text-right">
                {activeLicense ? (
                  <div>
                    <Badge variant="success">{DURATION_LABELS[activeLicense.duration]}</Badge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {activeLicense.expires_at ? `${remaining}d left` : "Lifetime"}
                    </p>
                  </div>
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
