"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DURATION_LABELS } from "@/lib/licenses";
import type { LicenseDuration } from "@/types/database";
import type { LicenseKeyWithProfile } from "@/types/admin";

const DURATIONS: LicenseDuration[] = ["1_day", "7_days", "14_days", "30_days", "lifetime"];

export function CreateKeysDialog({ onCreated }: { onCreated: (keys: LicenseKeyWithProfile[]) => void }) {
  const [open, setOpen] = useState(false);
  const [duration, setDuration] = useState<LicenseDuration>("30_days");
  const [count, setCount] = useState(1);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration, count }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to generate keys.");
        return;
      }
      toast.success(`Generated ${data.keys.length} key${data.keys.length > 1 ? "s" : ""}.`);
      onCreated(data.keys.map((k: LicenseKeyWithProfile) => ({ ...k, redeemed_profile: null })));
      setOpen(false);
      setCount(1);
    } catch {
      toast.error("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Create Keys
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate License Keys</DialogTitle>
          <DialogDescription>Create one or more redeemable keys for a given duration.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label>Duration</Label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={cn(
                    "rounded-[12px] border px-2 py-2.5 text-xs font-medium transition-colors sm:text-sm",
                    duration === d
                      ? "border-accent/60 bg-accent/15 text-foreground"
                      : "border-white/[0.08] bg-muted/40 text-muted-foreground hover:bg-muted",
                  )}
                >
                  {DURATION_LABELS[d]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="count">Quantity</Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.min(100, Math.max(1, Number(e.target.value) || 1)))}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button onClick={handleCreate} loading={loading}>
            Generate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
