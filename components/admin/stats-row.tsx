import { KeyRound, Users, CheckCircle2, Infinity as InfinityIcon } from "lucide-react";
import { MotionCard } from "@/components/dashboard/motion-card";

interface StatsRowProps {
  totalKeys: number;
  activeSubscriptions: number;
  totalUsers: number;
  lifetimeUsers: number;
}

export function StatsRow({ totalKeys, activeSubscriptions, totalUsers, lifetimeUsers }: StatsRowProps) {
  const stats = [
    { label: "Total Keys Generated", value: totalKeys, icon: KeyRound },
    { label: "Active Subscriptions", value: activeSubscriptions, icon: CheckCircle2 },
    { label: "Registered Users", value: totalUsers, icon: Users },
    { label: "Lifetime Members", value: lifetimeUsers, icon: InfinityIcon },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <MotionCard key={stat.label} delay={i * 0.05} className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-accent/15 text-accent">
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-semibold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        </MotionCard>
      ))}
    </div>
  );
}
