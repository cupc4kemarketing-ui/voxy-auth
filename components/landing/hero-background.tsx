"use client";

import { motion } from "framer-motion";

export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 grid-fade" />

      <motion.div
        animate={{ opacity: [0.5, 0.9, 0.5], scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 top-[-12%] h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-accent/25 blur-[140px]"
      />
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3], x: [0, 30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[8%] top-[18%] h-[320px] w-[320px] rounded-full bg-[#7c3aed]/25 blur-[120px]"
      />
      <motion.div
        animate={{ opacity: [0.3, 0.55, 0.3], x: [0, -30, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[6%] top-[26%] h-[280px] w-[280px] rounded-full bg-[#6366f1]/20 blur-[120px]"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
    </div>
  );
}
