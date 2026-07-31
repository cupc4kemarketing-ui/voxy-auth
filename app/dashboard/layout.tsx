import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getSessionContext();

  if (!ctx) {
    redirect("/login?redirectTo=/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <DashboardNav profile={ctx.profile} isAdmin={ctx.isAdmin} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">{children}</main>
    </div>
  );
}
