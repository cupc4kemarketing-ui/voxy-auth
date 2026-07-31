"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "14 Days",
    price: "$4.99",
    period: "one-time",
    description: "Try Voxy risk-free with full feature access.",
    features: ["Full module access", "Automatic updates", "Discord support", "1 device"],
    highlight: false,
  },
  {
    name: "30 Days",
    price: "$8.99",
    period: "one-time",
    description: "The most popular way to run Voxy.",
    features: ["Full module access", "Automatic updates", "Priority Discord support", "2 devices"],
    highlight: true,
  },
  {
    name: "Lifetime",
    price: "$39.99",
    period: "one-time",
    description: "Pay once, use Voxy forever.",
    features: ["Full module access", "Automatic updates", "Priority Discord support", "5 devices", "Early access to betas"],
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative px-4 py-28">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Simple pricing.</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            No subscriptions to forget about. Pick a duration, redeem your key, done.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative"
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full accent-gradient px-3 py-1 text-xs font-semibold text-white shadow-[0_4px_16px_-2px_rgba(79,70,229,0.6)]">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Most Popular
                  </span>
                </div>
              )}
              <Card
                className={cn(
                  "flex h-full flex-col p-7 transition-all duration-300 hover:-translate-y-1",
                  plan.highlight
                    ? "border-accent/40 shadow-[0_0_0_1px_rgba(79,70,229,0.35),0_24px_48px_-16px_rgba(79,70,229,0.35)]"
                    : "hover:border-white/[0.12]",
                )}
              >
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>

                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 shrink-0 text-accent" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className="mt-8"
                  variant={plan.highlight ? "default" : "secondary"}
                >
                  <Link href="/login">Get Started</Link>
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
