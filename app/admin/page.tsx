import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatsRow } from "@/components/admin/stats-row";
import { KeysPanel } from "@/components/admin/keys-panel";
import { UsersPanel } from "@/components/admin/users-panel";
import { ConfigsPanel } from "@/components/admin/configs-panel";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LicenseKeyWithProfile, AdminUser, SharedConfigWithAuthor } from "@/types/admin";
import type { License, Profile } from "@/types/database";

export default async function AdminPage() {
  const admin = createAdminClient();

  const [{ data: keys }, { data: profiles }, { data: activeLicenses }, { data: sharedConfigs }] = await Promise.all([
    admin
      .from("license_keys")
      .select("*, redeemed_profile:profiles!license_keys_redeemed_by_fkey(username, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(50),
    admin.from("profiles").select("*").order("created_at", { ascending: false }).limit(25),
    admin.from("licenses").select("*").eq("status", "active"),
    admin
      .from("shared_configs")
      .select("*, profiles(username)")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const profileRows = (profiles ?? []) as Profile[];
  const licenseRows = (activeLicenses ?? []) as License[];

  const configs: SharedConfigWithAuthor[] = (sharedConfigs ?? []).map((row) => {
    const r = row as unknown as {
      id: string;
      user_id: string;
      name: string;
      code: string;
      share_code: string;
      created_at: string;
      profiles: { username: string } | null;
    };
    return {
      id: r.id,
      user_id: r.user_id,
      name: r.name,
      code: r.code,
      share_code: r.share_code,
      created_at: r.created_at,
      author: r.profiles?.username ?? "Unknown",
    };
  });

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
        <p className="mt-1 text-sm text-muted-foreground">Manage license keys, users, and configs.</p>
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
          <TabsTrigger value="configs">Configs</TabsTrigger>
        </TabsList>
        <TabsContent value="keys">
          <KeysPanel initialKeys={(keys ?? []) as LicenseKeyWithProfile[]} />
        </TabsContent>
        <TabsContent value="users">
          <UsersPanel initialUsers={users} />
        </TabsContent>
        <TabsContent value="configs">
          <ConfigsPanel initialConfigs={configs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
