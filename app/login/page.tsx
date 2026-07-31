"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DiscordIcon } from "@/components/shared/social-icons";
import { HeroBackground } from "@/components/landing/hero-background";
import { createClient } from "@/lib/supabase/client";

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  useEffect(() => {
    if (searchParams.get("error") === "auth_failed") {
      toast.error("Login failed. Please try again.");
    }
  }, [searchParams]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace(redirectTo);
    });
  }, [router, redirectTo]);

  async function handleDiscordLogin() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center px-4">
      <HeroBackground />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <Card className="glass border-white/[0.08] p-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in with Discord to access your dashboard.
            </p>
          </div>

          <Button
            size="lg"
            className="mt-8 w-full bg-[#5865F2] hover:bg-[#6d78f5]"
            onClick={handleDiscordLogin}
            loading={loading}
          >
            {!loading && <DiscordIcon className="h-5 w-5" />}
            Continue with Discord
          </Button>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
            By continuing, you agree to Voxy&apos;s Terms of Service and acknowledge our Privacy
            Policy.
          </p>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            ← Back to home
          </Link>
        </p>
      </motion.div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
