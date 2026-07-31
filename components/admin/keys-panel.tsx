"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Trash2, Ban, RotateCcw, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreateKeysDialog } from "@/components/admin/create-keys-dialog";
import { DURATION_LABELS, computeExpiresAt } from "@/lib/licenses";
import type { LicenseKeyWithProfile } from "@/types/admin";

function statusBadge(status: LicenseKeyWithProfile["status"]) {
  switch (status) {
    case "unused":
      return <Badge variant="muted">Unused</Badge>;
    case "redeemed":
      return <Badge variant="success">Redeemed</Badge>;
    case "disabled":
      return <Badge variant="danger">Disabled</Badge>;
  }
}

export function KeysPanel({ initialKeys }: { initialKeys: LicenseKeyWithProfile[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return keys;
    const q = search.trim().toUpperCase();
    return keys.filter(
      (k) => k.key.includes(q) || k.redeemed_profile?.username.toUpperCase().includes(q),
    );
  }, [keys, search]);

  function handleCopy(key: string) {
    navigator.clipboard.writeText(key);
    toast.success("Key copied to clipboard.");
  }

  async function handleToggle(key: LicenseKeyWithProfile) {
    if (key.status === "redeemed") return;
    setPendingId(key.id);
    const nextStatus = key.status === "disabled" ? "unused" : "disabled";
    try {
      const res = await fetch(`/api/admin/keys/${key.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error();
      setKeys((prev) => prev.map((k) => (k.id === key.id ? { ...k, status: nextStatus } : k)));
      toast.success(nextStatus === "disabled" ? "Key disabled." : "Key re-enabled.");
    } catch {
      toast.error("Failed to update key.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(key: LicenseKeyWithProfile) {
    setPendingId(key.id);
    try {
      const res = await fetch(`/api/admin/keys/${key.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setKeys((prev) => prev.filter((k) => k.id !== key.id));
      toast.success("Key deleted.");
    } catch {
      toast.error("Failed to delete key.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by key or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 font-mono text-xs"
          />
        </div>
        <CreateKeysDialog onCreated={(created) => setKeys((prev) => [...created, ...prev])} />
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-left text-xs text-muted-foreground">
              <th className="pb-3 font-medium">Key</th>
              <th className="pb-3 font-medium">Duration</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Redeemed By</th>
              <th className="pb-3 font-medium">Redeemed At</th>
              <th className="pb-3 font-medium">Expiration</th>
              <th className="pb-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {filtered.map((key) => {
                const expiresAt =
                  key.status === "redeemed" && key.redeemed_at
                    ? computeExpiresAt(key.duration, new Date(key.redeemed_at))
                    : null;
                return (
                  <motion.tr
                    key={key.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-white/[0.04] last:border-0"
                  >
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => handleCopy(key.key)}
                        className="flex items-center gap-1.5 font-mono text-xs text-foreground/90 hover:text-accent"
                      >
                        {key.key}
                        <Copy className="h-3 w-3 shrink-0" />
                      </button>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{DURATION_LABELS[key.duration]}</td>
                    <td className="py-3 pr-4">{statusBadge(key.status)}</td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {key.redeemed_profile?.username ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {key.redeemed_at ? new Date(key.redeemed_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {key.duration === "lifetime" && key.status === "redeemed"
                        ? "Never"
                        : expiresAt
                          ? expiresAt.toLocaleDateString()
                          : "—"}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {key.status !== "redeemed" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            disabled={pendingId === key.id}
                            onClick={() => handleToggle(key)}
                            title={key.status === "disabled" ? "Re-enable" : "Deactivate"}
                          >
                            {key.status === "disabled" ? (
                              <RotateCcw className="h-3.5 w-3.5" />
                            ) : (
                              <Ban className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-danger hover:text-danger"
                          disabled={pendingId === key.id}
                          onClick={() => handleDelete(key)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No keys found.</p>
        )}
      </div>
    </Card>
  );
}
