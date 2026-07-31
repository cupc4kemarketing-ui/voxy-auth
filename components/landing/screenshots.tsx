"use client";

import { motion } from "framer-motion";
import { MonitorPlay } from "lucide-react";

const SHOTS = [
  { title: "HUD & Overlay", span: "lg:col-span-2 lg:row-span-2" },
  { title: "Module List" },
  { title: "Clickgui" },
  { title: "Settings" },
  { title: "Combat" },
];

export function Screenshots() {
  return (
    <section className="relative px-4 py-28">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">See it in action.</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A closer look at the interface players are switching for.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:grid-rows-2">
          {SHOTS.map((shot, i) => (
            <motion.div
              key={shot.title}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className={`group relative aspect-video overflow-hidden rounded-[18px] border border-white/[0.06] bg-card ${shot.span ?? ""}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent transition-opacity duration-500 group-hover:opacity-150" />
              <div className="grid-fade absolute inset-0 opacity-40" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground/60 transition-transform duration-500 group-hover:scale-105">
                <MonitorPlay className="h-8 w-8" />
                <span className="text-sm font-medium">{shot.title}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
