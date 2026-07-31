"use client";

import { motion } from "framer-motion";
import { Zap, Sparkles, ShieldCheck, Palette, Cpu, Gauge } from "lucide-react";
import { Card } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Zap,
    title: "Fast",
    description: "Optimized rendering pipeline delivers stable high FPS with near-zero overhead.",
  },
  {
    icon: Sparkles,
    title: "Modern",
    description: "A completely redesigned UI built for clarity, speed, and effortless navigation.",
  },
  {
    icon: ShieldCheck,
    title: "Reliable",
    description: "Rigorously tested across versions with automatic crash recovery built in.",
  },
  {
    icon: Palette,
    title: "Premium UI",
    description: "Fluid animations and a refined visual language you won't find anywhere else.",
  },
  {
    icon: Cpu,
    title: "120+ Modules",
    description: "An extensive suite of utility, visual, and QoL modules, constantly expanding.",
  },
  {
    icon: Gauge,
    title: "Low Latency",
    description: "Engineered networking layer minimizes input delay and packet overhead.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative px-4 py-28">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Built different.</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Every part of Voxy is designed to feel effortless — from the first launch to your
            thousandth session.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <Card className="group relative h-full overflow-hidden p-6 transition-all duration-300 hover:border-accent/30 hover:-translate-y-1">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/0 blur-3xl transition-all duration-500 group-hover:bg-accent/20" />
                <div className="relative mb-4 flex h-11 w-11 items-center justify-center rounded-[12px] bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="relative text-lg font-semibold">{feature.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
