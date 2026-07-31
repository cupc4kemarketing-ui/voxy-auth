"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Cta() {
  return (
    <section className="relative px-4 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto flex max-w-4xl flex-col items-center overflow-hidden rounded-[24px] border border-white/[0.08] px-8 py-16 text-center accent-gradient"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.15),transparent_60%)]" />
        <h2 className="relative text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to upgrade your gameplay?
        </h2>
        <p className="relative mt-3 max-w-md text-white/80">
          Join thousands of players already running Voxy. Login with Discord and get started in
          seconds.
        </p>
        <Button asChild size="lg" variant="secondary" className="relative mt-8 bg-white text-[#1e1b4b] hover:bg-white/90">
          <Link href="/login">
            Get Voxy Now <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </motion.div>
    </section>
  );
}
