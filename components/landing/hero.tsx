"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/landing/hero-background";
import { DiscordIcon } from "@/components/shared/social-icons";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

export function Hero() {
  return (
    <section id="top" className="relative flex min-h-[92vh] items-center justify-center px-4 pt-32 pb-20">
      <HeroBackground />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto flex max-w-4xl flex-col items-center text-center"
      >
        <motion.div
          variants={item}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-xs font-medium text-muted-foreground"
        >
          <span className="flex h-1.5 w-1.5 rounded-full bg-success animate-glow" />
          Version 1.0.0 is live
        </motion.div>

        <motion.h1
          variants={item}
          className="text-gradient text-6xl font-bold leading-[1.05] tracking-tight sm:text-7xl md:text-8xl"
        >
          VOXY CLIENT
        </motion.h1>

        <motion.p
          variants={item}
          className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-muted-foreground sm:text-xl"
        >
          The modern utility client for Minecraft. Blazing fast, meticulously
          crafted, and built for players who expect more.
        </motion.p>

        <motion.div variants={item} className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Button size="lg" asChild className="group">
            <Link href="/login">
              <Download className="h-[18px] w-[18px]" />
              Download
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer">
              <DiscordIcon className="h-[18px] w-[18px]" />
              Discord
            </a>
          </Button>
        </motion.div>

        <motion.div
          variants={item}
          className="mt-16 flex items-center gap-8 text-sm text-muted-foreground/70"
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl font-semibold text-foreground">50K+</span>
            Downloads
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl font-semibold text-foreground">120+</span>
            Modules
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl font-semibold text-foreground">24/7</span>
            Support
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
