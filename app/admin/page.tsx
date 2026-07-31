import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatsRow } from "@/components/admin/stats-row";
import { KeysPanel } from "@/components/admin/keys-panel";
import { UsersPanel } from "@/components/admin/users-panel";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LicenseKeyWithProfile, AdminUser } from "@/types/admin";
import type { License, Profile } from "@/types/database";

export default async function AdminPage() {
  const admin = createAdminClient();

  const [{ data: keys }, { data: profiles }, { data: activeLicenses }] = await Promise.all([
    admin
      .from("license_keys")
      .select("*, redeemed_profile:profiles!license_keys_redeemed_by_fkey(username, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(50),
    admin.from("profiles").select("*").order("created_at", { ascending: false }).limit(25),
    admin.from("licenses").select("*").eq("status", "active"),
  ]);

  const profileRows = (profiles ?? []) as Profile[];
  const licenseRows = (activeLicenses ?? []) as License[];

  const users: AdminUser[] = profileRows.map((profile) => ({
    ...profile,
    licenses: licenseRows.filter((l) => l.user_id === profile.id),
  }));

  const totalKeys = keys?.length ?? 0;
  const activeSubscriptions = licenseRows.length;
  const lifetimeUsers = licenseRows.filter((l) => l.duration === "lifetime").length;
  const { count: totalUsers } = await admin.from("profiles").select("*", { count: "exact", head: true });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin Panel</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage license keys and users.</p>
      </div>

      <StatsRow
        totalKeys={totalKeys}
        activeSubscriptions={activeSubscriptions}
        totalUsers={totalUsers ?? users.length}
        lifetimeUsers={lifetimeUsers}
      />

      <Tabs defaultValue="keys">
        <TabsList>
          <TabsTrigger value="keys">License Keys</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        <TabsContent value="keys">
          <KeysPanel initialKeys={(keys ?? []) as LicenseKeyWithProfile[]} />
        </TabsContent>
        <TabsContent value="users">
          <UsersPanel initialUsers={users} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
