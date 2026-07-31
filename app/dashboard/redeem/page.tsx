"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DURATION_LABELS } from "@/lib/licenses";
import type { License } from "@/types/database";

type Status = "idle" | "loading" | "success" | "error";

function formatKeyInput(value: string) {
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const groups = clean.match(/.{1,4}/g) ?? [];
  return groups.slice(0, 4).join("-");
}

export default function RedeemPage() {
  const [key, setKey] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [license, setLicense] = useState<License | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Invalid license key.");
        return;
      }

      setLicense(data.license);
      setStatus("success");
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 flex flex-col items-center text-center"
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[16px] bg-accent/15 text-accent">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Redeem a License Key</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your Voxy key below to activate your subscription instantly.
        </p>
      </motion.div>

      <Card className="w-full p-8">
        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="flex flex-col items-center py-4 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 15, delay: 0.1 }}
                className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success"
              >
                <CheckCircle2 className="h-9 w-9" />
              </motion.div>
              <h2 className="text-lg font-semibold">Key activated!</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your {license ? DURATION_LABELS[license.duration] : ""} subscription is now active.
              </p>
              <Button className="mt-6 w-full" onClick={() => router.push("/dashboard")}>
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="flex flex-col gap-5"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="key">License Key</Label>
                <Input
                  id="key"
                  placeholder="VOXY-XXXX-XXXX-XXXX"
                  value={key}
                  onChange={(e) => setKey(formatKeyInput(e.target.value))}
                  maxLength={19}
                  className="font-mono tracking-wider"
                  autoComplete="off"
                  autoFocus
                />
              </div>

              <AnimatePresence>
                {status === "error" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 overflow-hidden rounded-[12px] bg-danger/10 px-3 py-2.5 text-sm text-danger"
                  >
                    <XCircle className="h-4 w-4 shrink-0" />
                    {message}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                size="lg"
                loading={status === "loading"}
                disabled={key.replace(/-/g, "").length < 16}
              >
                Activate
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
